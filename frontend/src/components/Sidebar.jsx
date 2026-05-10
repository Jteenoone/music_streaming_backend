import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import { FaUserAlt } from "react-icons/fa";
import { IoIosAdd } from "react-icons/io";
import { MdLibraryMusic, MdGavel } from "react-icons/md";
import { artistAPI, albumAPI, normalizeAlbum, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function LibraryItem({ srcImg, name, type, isArtist, onClick }) {
  return (
    <div onClick={onClick} className="flex gap-2.5 my-1.5 items-center cursor-pointer hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors">
      {srcImg
        ? <img src={srcImg} alt={name} className={`w-[46px] h-[46px] aspect-square object-cover shrink-0 ${isArtist ? 'rounded-full' : 'rounded-md'}`}/>
        : <div className={`w-[46px] h-[46px] bg-[#2e3450] shrink-0 flex items-center justify-center text-[#6b7280] ${isArtist ? 'rounded-full' : 'rounded-md'}`}>
            {isArtist ? <FaUserAlt size={18}/> : <span className="text-lg">♪</span>}
          </div>
      }
      <div className="min-w-0">
        <p className="text-sm text-white m-0 truncate">{name}</p>
        <p className="text-xs text-[#9ca3af] m-0">{type}</p>
      </div>
    </div>
  );
}

// Popup nhắc đăng nhập
function LoginPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-[#2d6be4] rounded-xl p-4 shadow-2xl z-50">
      <p className="text-sm font-bold text-white m-0 mb-1">Tạo playlist</p>
      <p className="text-xs text-white/80 m-0 mb-4">Đăng nhập để tạo và chia sẻ playlist.</p>
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-xs text-white font-semibold bg-transparent border-none cursor-pointer hover:underline"
        >
          Để sau
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold bg-white text-[#1a1f35] px-4 py-1.5 rounded-full border-none cursor-pointer hover:scale-105 transition-transform"
        >
          Đăng nhập
        </button>
      </div>
      {/* Arrow */}
      <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#2d6be4]"/>
    </div>
  );
}

export default function Sidebar() {
  const [tab, setTab] = useState('all');
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const focusInput = useRef(null);
  const searchRef = useRef(null);
  const promptRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchLibrary = () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    userAPI.getLibrary()
      .then(res => {
        const lib = res.data.data ?? {};
        setArtists(lib.artists ?? []);
        setAlbums((lib.albums ?? []).map(a => ({
          id: a._id, name: a.title, image: a.coverImage ?? '', singer: '', artistId: a.artist,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLibrary(); }, [user]);
  useEffect(() => { if (showSearch) focusInput.current?.focus(); }, [showSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target) && !query)
        setShowSearch(false);
      if (promptRef.current && !promptRef.current.contains(e.target))
        setShowLoginPrompt(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  const q = query.toLowerCase();
  const filteredArtists = artists.filter(a => a.name.toLowerCase().includes(q));
  const filteredAlbums  = albums.filter(a => a.name.toLowerCase().includes(q));
  const showArtists = tab === 'all' || tab === 'artist';
  const showAlbums  = tab === 'all' || tab === 'album';

  const isEmpty = !loading && filteredArtists.length === 0 && filteredAlbums.length === 0;

  return (
    <div className="flex h-full flex-col text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca3af]">Thư viện</h3>
        <div className="relative" ref={promptRef}>
          <button
            onClick={() => user ? null : setShowLoginPrompt(v => !v)}
            className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-white bg-transparent border-none cursor-pointer transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <IoIosAdd size={20}/>
          </button>
          {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)}/>}
        </div>
      </div>

      {/* Khi chưa đăng nhập: luôn hiện card mời */}
      {!user && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="bg-[#1a1f35] rounded-xl p-4">
            <p className="text-sm font-bold text-white m-0 mb-1">Tạo playlist đầu tiên</p>
            <p className="text-xs text-[#9ca3af] m-0 mb-3">Dễ lắm, để tụi mình giúp bạn.</p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="text-xs font-bold text-[#1a1f35] bg-white px-4 py-1.5 rounded-full border-none cursor-pointer hover:scale-105 transition-transform"
            >
              Tạo playlist
            </button>
          </div>
          <div className="bg-[#1a1f35] rounded-xl p-4">
            <p className="text-sm font-bold text-white m-0 mb-1">Theo dõi nghệ sĩ yêu thích</p>
            <p className="text-xs text-[#9ca3af] m-0 mb-3">Thông tin từ các nghệ sĩ bạn theo dõi sẽ xuất hiện ở đây.</p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="text-xs font-bold text-[#1a1f35] bg-white px-4 py-1.5 rounded-full border-none cursor-pointer hover:scale-105 transition-transform"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      )}

      {/* Khi đã đăng nhập */}
      {user && (
        <>
          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {[['all', 'Tất cả'], ['artist', 'Nghệ sĩ'], ['album', 'Album']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                  tab === key ? 'bg-white text-[#1E2237] border-white font-semibold' : 'border-[#333] bg-[#1E2237] hover:bg-white/10'
                }`}
              >{label}</button>
            ))}
          </div>

          {/* Search */}
          <div ref={searchRef} className="relative flex items-center h-8 mb-3">
            {showSearch && (
              <input type="text" placeholder="Tìm trong thư viện..." ref={focusInput}
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 bg-[#2e3450] text-sm text-white rounded-lg border border-[#333] outline-none focus:border-[#7c83f5] transition-colors"
              />
            )}
            <button onClick={() => setShowSearch(true)}
              className={`bg-transparent border-none cursor-pointer text-[#9ca3af] hover:text-white transition-colors ${showSearch ? 'absolute left-2 top-1/2 -translate-y-1/2' : ''}`}
            >
              <CiSearch size={18}/>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-xs text-[#6b7280] py-2">Đang tải...</p>}

            {!loading && showArtists && filteredArtists.length > 0 && (
              <>
                {tab === 'all' && <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1 mt-1">Nghệ sĩ</p>}
                {filteredArtists.map(a => (
                  <LibraryItem key={a._id} srcImg={a.imageUrl} name={a.name} type="Nghệ sĩ" isArtist
                    onClick={() => navigate(`/artist/${a._id}`)}/>
                ))}
              </>
            )}

            {!loading && showAlbums && filteredAlbums.length > 0 && (
              <>
                {tab === 'all' && <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1 mt-3">Album</p>}
                {filteredAlbums.map(a => (
                  <LibraryItem key={a.id} srcImg={a.image} name={a.name} type={`Album · ${a.singer}`} isArtist={false}
                    onClick={() => navigate(`/album/${a.id}`)}/>
                ))}
              </>
            )}

            {!loading && user && filteredArtists.length === 0 && filteredAlbums.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <MdLibraryMusic size={36} color="#6b7280"/>
                <p className="text-xs text-[#6b7280] m-0">
                  {query ? `Không tìm thấy "${query}"` : 'Hãy theo dõi nghệ sĩ hoặc lưu album để thêm vào thư viện'}
                </p>
              </div>
            )}
          </div>

          {/* Khiếu nại bản quyền */}
          <div className="pt-3 mt-auto border-t border-[#2e3450]">
            <button
              onClick={() => navigate('/claims')}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs text-[#9ca3af] hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
            >
              <MdGavel size={15}/>
              Khiếu nại bản quyền
            </button>
          </div>
        </>
      )}
    </div>
  );
}
