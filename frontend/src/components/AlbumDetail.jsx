import { useEffect, useState } from 'react';
import { TrackItem } from './TrackItem';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause, FaCheck, FaBookmark } from "react-icons/fa";
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { albumAPI, normalizeAlbum, userAPI } from '../services/api';

export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [saved, setSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const { playSong, currentSong, isPlaying } = usePlayer();

    useEffect(() => {
        setLoading(true);
        albumAPI.getById(id)
            .then(res => setAlbum(normalizeAlbum(res.data.data)))
            .catch(() => setAlbum(null))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!user) return;
        userAPI.getLibrary()
            .then(res => {
                const albums = res.data.data.albums ?? [];
                setSaved(albums.some(a => a._id === id));
            })
            .catch(() => {});
    }, [id, user]);

    const handleSave = async () => {
        if (!user) { navigate('/login'); return; }
        setSaveLoading(true);
        try {
            const res = await userAPI.saveAlbum(id);
            setSaved(res.data.saved);
        } catch {}
        finally { setSaveLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[300px] text-[#9ca3af] text-sm">Đang tải album...</div>
    );
    if (!album) return (
        <div className="flex items-center justify-center min-h-[300px] text-white text-lg">Không tìm thấy album</div>
    );

    const handlePlayAlbum = () => { if (album.songs.length > 0) playSong(album.songs[0], album.songs); };
    const handlePlaySong = (song) => playSong(song, album.songs);
    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = String(Math.floor(seconds % 60)).padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="bg-[#121212] min-h-screen text-white pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 pb-4 bg-gradient-to-b from-[#00adb5] via-[#005f73] to-[#121212] sm:flex-row sm:items-end sm:px-6 sm:pt-10 sm:pb-6">
                {album.image && (
                    <img src={album.image} alt={album.name} className="w-[220px] h-[220px] object-cover rounded-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] shrink-0"/>
                )}
                <div className="flex flex-col justify-end gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/80">Album</span>
                    <h2 className="m-0 text-[clamp(28px,5vw,72px)] font-black leading-[1.05] tracking-[-0.02em] text-white">{album.name}</h2>
                    <p className="text-sm text-white/70 m-0">
                        {album.singer} &bull; {album.songs.length} bài hát{album.releaseYear ? ` · ${album.releaseYear}` : ''}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 px-6 pt-5 pb-2">
                <button
                    onClick={handlePlayAlbum}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1db954] border-none cursor-pointer transition-all duration-150 shadow-[0_4px_16px_rgba(29,185,84,0.4)] hover:bg-[#1ed760] hover:scale-[1.06] active:scale-[0.97]"
                >
                    <FaPlay color="#fff" fontSize="20px"/>
                </button>

                <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer disabled:opacity-60 ${
                        saved
                            ? 'bg-[#1db954] border-[#1db954] text-white hover:bg-[#1aa34a]'
                            : 'bg-transparent border-white/40 text-white hover:border-white'
                    }`}
                >
                    {saved ? <FaCheck size={12}/> : <FaBookmark size={12}/>}
                    {saved ? 'Đã lưu' : 'Lưu album'}
                </button>
            </div>

            {/* Track table */}
            <div className="px-6">
                <table className="w-full border-collapse table-fixed">
                    <colgroup>
                        <col style={{ width: '40px' }} />
                        <col />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '60px' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="py-1.5 pr-4 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-center">#</th>
                            <th className="py-1.5 pr-4 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-left">Title</th>
                            <th className="py-1.5 pr-4 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-left">Album</th>
                            <th className="py-1.5 pr-2 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {album.songs.map((song, idx) => {
                            const isCurrent = currentSong?.id === song.id;
                            return (
                                <tr
                                    key={song.id}
                                    className="rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.07]"
                                    onClick={() => handlePlaySong(song)}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    <td className="py-2.5 pr-0 text-[15px] text-[#a7a7a7] text-center">
                                        {isCurrent && isPlaying
                                            ? <FaPause size={13} color="#1db954"/>
                                            : hoveredIdx === idx
                                                ? <FaPlay size={13}/>
                                                : <span className={isCurrent ? 'text-[#1db954]' : ''}>{idx + 1}</span>
                                        }
                                    </td>
                                    <td className="py-2.5 pr-4 text-sm text-white whitespace-nowrap overflow-hidden text-ellipsis">
                                        <TrackItem srcImg={song.src_img} nameSinger={song.singer} nameSong={song.name}/>
                                    </td>
                                    <td className="py-2.5 pr-4 text-sm text-[#b3b3b3] whitespace-nowrap overflow-hidden text-ellipsis">{album.name}</td>
                                    <td className="py-2.5 pr-2 text-sm text-[#b3b3b3] text-right whitespace-nowrap">{formatDuration(song.duration)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
