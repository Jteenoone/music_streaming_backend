import { useEffect, useState } from 'react';
import { FaPlay, FaPause, FaHeart } from 'react-icons/fa';
import { favoriteAPI, normalizeSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

function formatDuration(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

export default function FavoritesPage() {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    setLoading(true);
    favoriteAPI.getAll()
      .then(res => setSongs((res.data.data ?? []).map(normalizeSong).filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnfavorite = async (songId, idx) => {
    try {
      await favoriteAPI.toggle(songId);
      setSongs(prev => prev.filter((_, i) => i !== idx));
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px] text-[#9ca3af] text-sm">Đang tải...</div>
  );

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 pb-4 bg-gradient-to-b from-[#1db954]/60 via-[#0d2e18] to-[#121212] sm:flex-row sm:items-end sm:pt-10 sm:pb-6">
        <div className="w-[220px] h-[220px] bg-gradient-to-br from-[#1db954] to-[#0a7c30] rounded-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] shrink-0 flex items-center justify-center">
          <FaHeart size={72} color="white"/>
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/80">Playlist</span>
          <h2 className="m-0 text-[clamp(28px,5vw,64px)] font-black leading-[1.05] tracking-[-0.02em]">Bài hát yêu thích</h2>
          <p className="text-sm text-white/70 m-0">{songs.length} bài hát</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-2">
        <button
          onClick={() => songs.length > 0 && playSong(songs[0], songs)}
          disabled={songs.length === 0}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1db954] border-none cursor-pointer transition-all shadow-lg hover:bg-[#1ed760] hover:scale-[1.06] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaPlay color="#fff" size={20}/>
        </button>
      </div>

      {/* Song list */}
      <div className="px-6">
        {songs.length === 0 ? (
          <p className="text-[#6b7280] text-sm py-8 text-center">Bạn chưa yêu thích bài hát nào.</p>
        ) : (
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '40px' }}/>
              <col/>
              <col style={{ width: '60px' }}/>
              <col style={{ width: '44px' }}/>
            </colgroup>
            <thead>
              <tr>
                <th className="py-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-center">#</th>
                <th className="py-1.5 pr-4 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-left">Tên bài</th>
                <th className="py-1.5 pr-2 text-[11px] font-medium tracking-[0.1em] uppercase text-[#a7a7a7] border-b border-white/10 text-right">Thời gian</th>
                <th className="border-b border-white/10"/>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <tr
                    key={song.id + idx}
                    className="transition-colors duration-150 cursor-pointer hover:bg-white/[0.07] group"
                    onClick={() => playSong(song, songs)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <td className="py-2.5 text-[15px] text-[#a7a7a7] text-center">
                      {isCurrent && isPlaying
                        ? <FaPause size={13} color="#1db954"/>
                        : hoveredIdx === idx
                          ? <FaPlay size={13}/>
                          : <span className={isCurrent ? 'text-[#1db954]' : ''}>{idx + 1}</span>
                      }
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-3">
                        {song.src_img && <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>}
                        <div className="min-w-0">
                          <p className={`text-sm m-0 truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>{song.name}</p>
                          <p className="text-xs text-[#b3b3b3] m-0 truncate">{song.singer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-sm text-[#b3b3b3] text-right whitespace-nowrap">{formatDuration(song.duration)}</td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); handleUnfavorite(song.id, idx); }}
                        className="opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer text-[#1db954] hover:text-[#f87171] transition-all p-1"
                        title="Bỏ yêu thích"
                      >
                        <FaHeart size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
