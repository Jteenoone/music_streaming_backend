import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import logo from '../assets/images/apple-music.jpg';
import { CiSearch } from "react-icons/ci";
import { FaUserAlt } from "react-icons/fa";
import { songAPI, normalizeSong, normalizeAlbum } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ songs: [], artists: [], albums: [] });
  const [showResults, setShowResults] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) { setResults({ songs: [], artists: [], albums: [] }); setShowResults(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await songAPI.search(q);
        const songs = (res.data.data ?? []).map(s => normalizeSong(s)).filter(Boolean);
        const artists = (res.data.artists ?? []).map(a => ({
          id: a._id, name: a.name, src_img: a.imageUrl ?? '',
        }));
        const albums = (res.data.albums ?? []).map(a => ({
          id: a._id, name: a.title, src_img: a.coverImage ?? '',
          singer: a.artist?.name ?? '',
        }));
        setResults({ songs, artists, albums });
        setShowResults(true);
      } catch {
        setResults({ songs: [], artists: [], albums: [] });
      }
    }, 300);
  };

  const closeResults = () => { setQuery(''); setShowResults(false); };

  const handleSongClick = (song) => {
    closeResults();
    playSong(song, results.songs);
  };
  const handleArtistClick = (artist) => {
    closeResults();
    navigate(`/artist/${artist.id}`);
  };
  const handleAlbumClick = (album) => {
    closeResults();
    navigate(`/album/${album.id}`);
  };

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex items-center justify-between bg-[#323750] border-b border-[#1E2237] text-white h-full px-5 gap-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 shrink-0 no-underline text-white">
        <img src={logo} alt="Logo" className="w-[40px] rounded-md"/>
        <span className="font-semibold text-sm hidden sm:block">Sound Wave</span>
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-[500px]">
        <div className="flex items-center bg-[#272D43] rounded-full px-3 py-2 gap-2">
          <CiSearch size={18} color="#9ca3af"/>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            onFocus={() => query && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[#6b7280] w-full"
          />
        </div>

        {showResults && hasResults && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#1E2237] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
            {results.artists.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-[#6b7280] px-4 pt-3 pb-1 m-0">Nghệ sĩ</p>
                {results.artists.map(a => (
                  <div key={a.id} onMouseDown={() => handleArtistClick(a)}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                    {a.src_img
                      ? <img src={a.src_img} alt="" className="w-9 h-9 object-cover shrink-0 rounded-full"/>
                      : <div className="w-9 h-9 bg-[#2e3450] shrink-0 flex items-center justify-center rounded-full"><FaUserAlt size={14} color="#6b7280"/></div>
                    }
                    <div className="min-w-0">
                      <p className="text-sm text-white m-0 truncate">{a.name}</p>
                      <p className="text-xs text-[#9ca3af] m-0">Nghệ sĩ</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {results.albums.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-[#6b7280] px-4 pt-3 pb-1 m-0">Album</p>
                {results.albums.map(a => (
                  <div key={a.id} onMouseDown={() => handleAlbumClick(a)}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                    {a.src_img
                      ? <img src={a.src_img} alt="" className="w-9 h-9 object-cover shrink-0 rounded"/>
                      : <div className="w-9 h-9 bg-[#2e3450] shrink-0 flex items-center justify-center rounded"><span className="text-base text-[#6b7280]">♪</span></div>
                    }
                    <div className="min-w-0">
                      <p className="text-sm text-white m-0 truncate">{a.name}</p>
                      <p className="text-xs text-[#9ca3af] m-0">Album · {a.singer}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {results.songs.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-[#6b7280] px-4 pt-3 pb-1 m-0">Bài hát</p>
                {results.songs.map(s => (
                  <div key={s.id} onMouseDown={() => handleSongClick(s)}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                    {s.src_img
                      ? <img src={s.src_img} alt="" className="w-9 h-9 object-cover shrink-0 rounded"/>
                      : <div className="w-9 h-9 bg-[#2e3450] shrink-0 flex items-center justify-center rounded"><span className="text-base text-[#6b7280]">♪</span></div>
                    }
                    <div className="min-w-0">
                      <p className="text-sm text-white m-0 truncate">{s.name}</p>
                      <p className="text-xs text-[#9ca3af] m-0">Bài hát · {s.singer}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {showResults && query && !hasResults && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#1E2237] border border-[#333] rounded-xl shadow-xl z-50 px-4 py-3">
            <p className="text-sm text-[#6b7280] m-0">Không tìm thấy kết quả cho "{query}"</p>
          </div>
        )}
      </div>

      {/* Auth */}
      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-[#7c83f5] no-underline px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                Admin
              </Link>
            )}
            <button onClick={() => navigate('/profile')}
              className="text-sm text-[#9ca3af] hidden sm:block bg-transparent border-none cursor-pointer hover:text-white transition-colors px-1">
              {user.username}
            </button>
            <button
              onClick={handleLogout}
              className="bg-transparent border border-[#2e3450] text-sm text-white px-4 py-2 rounded-full cursor-pointer hover:bg-white/5 transition-colors"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="text-sm text-white no-underline px-4 py-2 rounded-full hover:text-white/80 transition-colors">Đăng ký</Link>
            <Link to="/login" className="bg-white text-[#323750] text-sm font-semibold no-underline px-4 py-2 rounded-full hover:bg-white/90 transition-colors">Đăng nhập</Link>
          </>
        )}
      </div>
    </div>
  );
}
