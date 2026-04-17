import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import logo from '../assets/images/apple-music.jpg';
import { CiSearch } from "react-icons/ci";
import { songAPI, albumAPI, normalizeSong, normalizeAlbum } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await songAPI.search(q);
        const songs = (res.data.data ?? []).map(s => ({ ...normalizeSong(s), type: 'song' }));
        setResults(songs.slice(0, 8));
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const handleResultClick = (item) => {
    setQuery('');
    setShowResults(false);
    if (item.type === 'album') {
      navigate(`/album/${item.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between bg-[#323750] border-b border-[#1E2237] text-white h-full px-5 gap-4">
      {/* Logo */}
      <nav className="flex items-center gap-2.5 shrink-0">
        <img src={logo} alt="Logo" className="w-[40px] rounded-md"/>
        <span className="font-semibold text-sm hidden sm:block">Sound Wave</span>
      </nav>

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

        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#1E2237] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden">
            {results.map((item, i) => (
              <div
                key={`${item.type}-${item.id}-${i}`}
                onMouseDown={() => handleResultClick(item)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <img src={item.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>
                <div className="min-w-0">
                  <p className="text-sm text-white m-0 truncate">{item.name}</p>
                  <p className="text-xs text-[#9ca3af] m-0">{item.singer} · Bài hát</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && query && results.length === 0 && (
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
            <span className="text-sm text-[#9ca3af] hidden sm:block">{user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-transparent border border-[#2e3450] text-sm text-white px-4 py-2 rounded-full cursor-pointer hover:bg-white/5 transition-colors"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="text-sm text-white no-underline px-4 py-2 rounded-full hover:text-white/80 transition-colors">
              Đăng ký
            </Link>
            <Link to="/login" className="bg-white text-[#323750] text-sm font-semibold no-underline px-4 py-2 rounded-full hover:bg-white/90 transition-colors">
              Đăng nhập
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
