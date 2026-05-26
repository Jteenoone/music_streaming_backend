import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause, FaTrash, FaPencilAlt, FaCheck } from 'react-icons/fa';
import { MdArrowBack, MdQueueMusic } from 'react-icons/md';
import { playlistAPI, normalizeSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

function formatDuration(s) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Rename state
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const nameRef = useRef(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    playlistAPI.getById(id)
      .then(res => {
        const data = res.data.data;
        setPlaylist(data);
        setNameInput(data.name);
        setSongs((data.songs ?? []).map(normalizeSong).filter(Boolean));
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (renaming) nameRef.current?.focus(); }, [renaming]);

  const handlePlayAll = () => {
    if (songs.length > 0) playSong(songs[0], songs);
  };

  const handleSaveName = async () => {
    const name = nameInput.trim();
    if (!name || name === playlist?.name || renameLoading) { setRenaming(false); return; }
    setRenameLoading(true);
    try {
      await playlistAPI.rename(id, name);
      setPlaylist(prev => ({ ...prev, name }));
    } catch {}
    finally { setRenameLoading(false); setRenaming(false); }
  };

  const handleRemoveSong = async (songId, idx) => {
    try {
      await playlistAPI.removeSong(id, songId);
      setSongs(prev => prev.filter((_, i) => i !== idx));
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await playlistAPI.delete(id);
      navigate(-1);
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px] text-[#9ca3af] text-sm">Đang tải...</div>
  );

  return (
    <div className="bg-[#121212] min-h-screen text-white pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 pb-4 bg-gradient-to-b from-[#3b3f70] via-[#252840] to-[#121212] sm:flex-row sm:items-end sm:pt-10 sm:pb-6">
        <div className="w-[220px] h-[220px] bg-[#2e3450] rounded-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] shrink-0 flex items-center justify-center">
          <MdQueueMusic size={72} color="#6b7280"/>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/80">Playlist</span>

          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setRenaming(false); }}
                className="text-[clamp(24px,4vw,52px)] font-black bg-transparent border-b-2 border-[#7c83f5] outline-none text-white leading-tight w-full"
              />
              <button onClick={handleSaveName} disabled={renameLoading} className="bg-[#7c83f5] text-white p-2 rounded-full border-none cursor-pointer hover:bg-[#6670e8] disabled:opacity-50">
                <FaCheck size={12}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="m-0 text-[clamp(28px,5vw,64px)] font-black leading-[1.05] tracking-[-0.02em]">{playlist?.name}</h2>
              <button onClick={() => setRenaming(true)} className="opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-white p-1 transition-opacity">
                <FaPencilAlt size={14}/>
              </button>
            </div>
          )}

          <p className="text-sm text-white/70 m-0">{songs.length} bài hát</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-6 pt-5 pb-2">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#7c83f5] border-none cursor-pointer transition-all shadow-lg hover:bg-[#6670e8] hover:scale-[1.06] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaPlay color="#fff" size={20}/>
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-[#f87171]/50 text-[#f87171] bg-transparent cursor-pointer hover:border-[#f87171] hover:bg-[#f87171]/10 transition-all"
          >
            <FaTrash size={12}/> Xóa playlist
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9ca3af]">Xóa playlist này?</span>
            <button onClick={handleDelete} className="px-3 py-1.5 rounded-full bg-[#f87171] text-white text-xs font-bold border-none cursor-pointer hover:bg-[#ef4444]">Xóa</button>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-full border border-[#333] text-[#9ca3af] text-xs bg-transparent cursor-pointer hover:text-white">Hủy</button>
          </div>
        )}
      </div>

      {/* Song list */}
      <div className="px-6">
        {songs.length === 0 ? (
          <p className="text-[#6b7280] text-sm py-8 text-center">Playlist chưa có bài hát nào. Thêm bài từ trình phát nhạc.</p>
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
                    className="rounded-md transition-colors duration-150 cursor-pointer hover:bg-white/[0.07] group"
                    onClick={() => playSong(song, songs)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <td className="py-2.5 text-[15px] text-[#a7a7a7] text-center">
                      {isCurrent && isPlaying
                        ? <FaPause size={13} color="#7c83f5"/>
                        : hoveredIdx === idx
                          ? <FaPlay size={13}/>
                          : <span className={isCurrent ? 'text-[#7c83f5]' : ''}>{idx + 1}</span>
                      }
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-3">
                        {song.src_img && <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>}
                        <div className="min-w-0">
                          <p className={`text-sm m-0 truncate ${isCurrent ? 'text-[#7c83f5]' : 'text-white'}`}>{song.name}</p>
                          <p className="text-xs text-[#b3b3b3] m-0 truncate">{song.singer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-sm text-[#b3b3b3] text-right whitespace-nowrap">{formatDuration(song.duration)}</td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveSong(song.id, idx); }}
                        className="opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer text-[#6b7280] hover:text-[#f87171] transition-all p-1"
                        title="Xóa khỏi playlist"
                      >
                        <FaTrash size={12}/>
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
