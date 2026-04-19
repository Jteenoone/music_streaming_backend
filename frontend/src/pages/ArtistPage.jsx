import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause, FaUserAlt, FaCheck } from 'react-icons/fa';
import { artistAPI, normalizeSong, userAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

export default function ArtistPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [artist, setArtist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const { playSong, currentSong, isPlaying } = usePlayer();

    useEffect(() => {
        setLoading(true);
        artistAPI.getSongs(id)
            .then(res => {
                setArtist(res.data.data.artist);
                setSongs((res.data.data.songs ?? []).map(normalizeSong));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    // Kiểm tra xem user đã follow chưa
    useEffect(() => {
        if (!user) return;
        userAPI.getLibrary()
            .then(res => {
                const artists = res.data.data.artists ?? [];
                setFollowing(artists.some(a => a._id === id));
            })
            .catch(() => {});
    }, [id, user]);

    const handleFollow = async () => {
        if (!user) { navigate('/login'); return; }
        setFollowLoading(true);
        try {
            const res = await userAPI.followArtist(id);
            setFollowing(res.data.following);
        } catch {}
        finally { setFollowLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[300px] text-[#9ca3af] text-sm">Đang tải...</div>
    );
    if (!artist) return (
        <div className="flex items-center justify-center min-h-[300px] text-white text-lg">Không tìm thấy ca sĩ</div>
    );

    const handlePlayAll = () => { if (songs.length > 0) playSong(songs[0], songs); };

    const formatDuration = (s) => {
        if (!s) return '--:--';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    return (
        <div className="text-white pb-10">
            {/* Header */}
            <div className="flex items-end gap-6 p-6 pb-5 bg-gradient-to-b from-[#3b1f6e] via-[#1e1b4b] to-transparent rounded-xl mb-2">
                {artist.imageUrl
                    ? <img src={artist.imageUrl} alt={artist.name} className="w-[160px] h-[160px] rounded-full object-cover shadow-2xl shrink-0"/>
                    : <div className="w-[160px] h-[160px] rounded-full bg-[#2e3450] flex items-center justify-center shrink-0"><FaUserAlt size={60} color="#6b7280"/></div>
                }
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">Ca sĩ</span>
                    <h1 className="m-0 text-[clamp(28px,5vw,64px)] font-black leading-tight">{artist.name}</h1>
                    {artist.bio && <p className="text-sm text-white/60 m-0 max-w-[500px]">{artist.bio}</p>}
                    <p className="text-sm text-white/50 m-0">{songs.length} bài hát</p>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 py-4 flex items-center gap-4">
                <button
                    onClick={handlePlayAll}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#7c83f5] border-none cursor-pointer transition-all hover:bg-[#6670e8] hover:scale-105 active:scale-95"
                >
                    <FaPlay color="#fff" size={20}/>
                </button>

                <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer disabled:opacity-60 ${
                        following
                            ? 'bg-[#7c83f5] border-[#7c83f5] text-white hover:bg-[#6670e8]'
                            : 'bg-transparent border-white/40 text-white hover:border-white'
                    }`}
                >
                    {following && <FaCheck size={12}/>}
                    {following ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
            </div>

            {/* Song list */}
            <div className="px-6">
                {songs.length === 0 && <p className="text-[#6b7280] text-sm">Ca sĩ này chưa có bài hát nào.</p>}
                <table className="w-full border-collapse table-fixed">
                    <colgroup>
                        <col style={{ width: '40px' }}/>
                        <col/>
                        <col style={{ width: '80px' }}/>
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="py-1.5 text-[11px] font-medium tracking-widest uppercase text-[#a7a7a7] border-b border-white/10 text-center">#</th>
                            <th className="py-1.5 text-[11px] font-medium tracking-widest uppercase text-[#a7a7a7] border-b border-white/10 text-left">Bài hát</th>
                            <th className="py-1.5 text-[11px] font-medium tracking-widest uppercase text-[#a7a7a7] border-b border-white/10 text-right pr-2">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map((song, idx) => {
                            const isCurrent = currentSong?.id === song.id;
                            return (
                                <tr
                                    key={song.id}
                                    onClick={() => playSong(song, songs)}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    className="cursor-pointer hover:bg-white/[0.07] transition-colors rounded-md"
                                >
                                    <td className="py-3 text-[15px] text-[#a7a7a7] text-center">
                                        {isCurrent && isPlaying
                                            ? <FaPause size={13} color="#7c83f5"/>
                                            : hoveredIdx === idx
                                                ? <FaPlay size={13}/>
                                                : <span className={isCurrent ? 'text-[#7c83f5]' : ''}>{idx + 1}</span>
                                        }
                                    </td>
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <img src={song.src_img} alt="" className="w-10 h-10 rounded object-cover shrink-0"/>
                                            <span className={`text-sm truncate ${isCurrent ? 'text-[#7c83f5]' : 'text-white'}`}>{song.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-sm text-[#b3b3b3] text-right pr-2 whitespace-nowrap">
                                        {formatDuration(song.duration)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
