import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import { FaUserAlt, FaHeart, FaTrash } from "react-icons/fa";
import { IoIosAdd } from "react-icons/io";
import { MdLibraryMusic, MdGavel, MdQueueMusic, MdCheck, MdGroups } from "react-icons/md";
import { userAPI, playlistAPI, favoriteAPI, normalizeSong } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Single library row ────────────────────────────────────────────────────────
function LibraryItem({ srcImg, name, sub, isArtist, isPlaylist, isFav, onDelete, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex gap-2.5 my-1.5 items-center cursor-pointer hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors group"
    >
      {srcImg
        ? <img src={srcImg} alt={name} className={`w-[46px] h-[46px] aspect-square object-cover shrink-0 ${isArtist ? 'rounded-full' : 'rounded-md'}`}/>
        : <div className={`w-[46px] h-[46px] shrink-0 flex items-center justify-center ${
            isFav
              ? 'bg-gradient-to-br from-[#1db954] to-[#0a7c30] rounded-md'
              : 'bg-[#2e3450] rounded-md'
          } ${isArtist ? '!rounded-full' : ''}`}>
            {isArtist
              ? <FaUserAlt size={18} color="#6b7280"/>
              : isFav
                ? <FaHeart size={18} color="white"/>
                : <MdQueueMusic size={22} color="#6b7280"/>}
          </div>
      }
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white m-0 truncate">{name}</p>
        <p className="text-xs text-[#9ca3af] m-0">{sub}</p>
      </div>
      {onDelete && hover && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Xóa playlist"
          className="shrink-0 bg-transparent border-none cursor-pointer text-[#6b7280] hover:text-[#f87171] p-1 transition-colors"
        >
          <FaTrash size={12}/>
        </button>
      )}
    </div>
  );
}

// ── Login prompt modal (nổi giữa màn hình, không nằm trong sidebar) ────────────
// title/desc cho phép tái sử dụng cho nhiều ngữ cảnh (tạo playlist, theo dõi nghệ sĩ...)
function LoginModal({ onClose, title = 'Tạo playlist', desc = 'Đăng nhập để tạo và chia sẻ playlist.' }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[360px] bg-[#2d6be4] rounded-2xl p-6 shadow-2xl"
      >
        <p className="text-lg font-bold text-white m-0 mb-2">{title}</p>
        <p className="text-sm text-white/80 m-0 mb-6">{desc}</p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm text-white font-semibold bg-transparent border-none cursor-pointer hover:underline px-2">Để sau</button>
          <button onClick={() => navigate('/login')} className="text-sm font-bold bg-white text-[#1a1f35] px-5 py-2 rounded-full border-none cursor-pointer hover:scale-105 transition-transform">Đăng nhập</button>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'all',    label: 'Tất cả' },
  { key: 'playlist', label: 'Playlist' },
  { key: 'artist',   label: 'Nghệ sĩ' },
  { key: 'album',    label: 'Album' },
];

export default function Sidebar() {
  const [tab, setTab]               = useState('all');
  const [artists, setArtists]       = useState([]);
  const [albums, setAlbums]         = useState([]);
  const [playlists, setPlaylists]   = useState([]);
  const [favCount, setFavCount]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [cardPrompt, setCardPrompt] = useState(null); // 'playlist' | 'artist' | null

  // Create-playlist form
  const [creatingPlaylist, setCreatingPlaylist]   = useState(false);
  const [newPlaylistName, setNewPlaylistName]     = useState('');
  const [createLoading, setCreateLoading]         = useState(false);
  const [createDone, setCreateDone]               = useState(false);

  const focusInput     = useRef(null);
  const searchRef      = useRef(null);
  const promptRef      = useRef(null);
  const createInputRef = useRef(null);
  const navigate       = useNavigate();
  const { user }       = useAuth();

  const fetchLibrary = () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      userAPI.getLibrary(),
      playlistAPI.getAll().catch(() => ({ data: { data: [] } })),
      favoriteAPI.getAll().catch(() => ({ data: { data: [], total: 0 } })),
    ]).then(([libRes, plRes, favRes]) => {
      const lib = libRes.data.data ?? {};
      setArtists(lib.artists ?? []);
      setAlbums((lib.albums ?? []).map(a => ({
        id: a._id, name: a.title, image: a.coverImage ?? '', singer: '',
      })));
      setPlaylists(plRes.data.data ?? []);
      setFavCount(favRes.data.total ?? (favRes.data.data ?? []).length);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLibrary(); }, [user]);
  useEffect(() => { if (showSearch) focusInput.current?.focus(); }, [showSearch]);
  useEffect(() => { if (creatingPlaylist) createInputRef.current?.focus(); }, [creatingPlaylist]);

  useEffect(() => {
    function handleOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target) && !query) setShowSearch(false);
      if (promptRef.current && !promptRef.current.contains(e.target)) setShowLoginPrompt(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [query]);

  const handleCreatePlaylist = async (e) => {
    e?.preventDefault();
    const name = newPlaylistName.trim();
    if (!name || createLoading) return;
    setCreateLoading(true);
    try {
      const res = await playlistAPI.create(name);
      setPlaylists(prev => [res.data.data, ...prev]);
      setNewPlaylistName('');
      setCreateDone(true);
      setTimeout(() => { setCreatingPlaylist(false); setCreateDone(false); }, 700);
    } catch {}
    finally { setCreateLoading(false); }
  };

  const handleDeletePlaylist = async (id) => {
    try {
      await playlistAPI.delete(id);
      setPlaylists(prev => prev.filter(p => p._id !== id));
    } catch {}
  };

  const q                 = query.toLowerCase();
  const filteredArtists   = artists.filter(a => a.name?.toLowerCase().includes(q));
  const filteredAlbums    = albums.filter(a => a.name?.toLowerCase().includes(q));
  const filteredPlaylists = playlists.filter(p => p.name?.toLowerCase().includes(q));

  const showPlaylists = tab === 'all' || tab === 'playlist';
  const showArtists   = tab === 'all' || tab === 'artist';
  const showAlbums    = tab === 'all' || tab === 'album';
  // Favorites card shown in 'all' and 'playlist' tabs
  const showFav = (tab === 'all' || tab === 'playlist') && !q;

  const noResults = !loading
    && filteredArtists.length  === 0
    && filteredAlbums.length   === 0
    && filteredPlaylists.length === 0
    && !showFav;

  return (
    <div className="flex h-full flex-col text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#9ca3af]">Thư viện</h3>
        <div className="relative" ref={promptRef}>
          <button
            onClick={() => user ? setCreatingPlaylist(v => !v) : setShowLoginPrompt(v => !v)}
            title="Tạo playlist mới"
            className="flex items-center text-xs text-[#9ca3af] hover:text-white bg-transparent border-none cursor-pointer transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <IoIosAdd size={20}/>
          </button>
          {showLoginPrompt && <LoginModal onClose={() => setShowLoginPrompt(false)}/>}
        </div>
      </div>

      {/* Not logged in */}
      {!user && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="bg-[#1a1f35] rounded-xl p-4">
            <p className="text-sm font-bold text-white m-0 mb-1">Tạo playlist đầu tiên</p>
            <p className="text-xs text-[#9ca3af] m-0 mb-3">Dễ lắm, để tụi mình giúp bạn.</p>
            <button onClick={() => setCardPrompt('playlist')} className="text-xs font-bold text-[#1a1f35] bg-white px-4 py-1.5 rounded-full border-none cursor-pointer hover:scale-105 transition-transform">Tạo playlist</button>
          </div>
          <div className="bg-[#1a1f35] rounded-xl p-4">
            <p className="text-sm font-bold text-white m-0 mb-1">Theo dõi nghệ sĩ yêu thích</p>
            <p className="text-xs text-[#9ca3af] m-0 mb-3">Thông tin từ các nghệ sĩ bạn theo dõi sẽ xuất hiện ở đây.</p>
            <button onClick={() => setCardPrompt('artist')} className="text-xs font-bold text-[#1a1f35] bg-white px-4 py-1.5 rounded-full border-none cursor-pointer hover:scale-105 transition-transform">Đăng nhập</button>
          </div>
        </div>
      )}

      {/* Modal đăng nhập nổi giữa màn hình (ngoài sidebar) */}
      {cardPrompt === 'playlist' && (
        <LoginModal
          onClose={() => setCardPrompt(null)}
          title="Tạo playlist"
          desc="Đăng nhập để tạo và chia sẻ playlist."
        />
      )}
      {cardPrompt === 'artist' && (
        <LoginModal
          onClose={() => setCardPrompt(null)}
          title="Theo dõi nghệ sĩ"
          desc="Đăng nhập để theo dõi nghệ sĩ yêu thích."
        />
      )}

      {/* Logged in */}
      {user && (
        <>
          {/* Create-playlist inline form */}
          {creatingPlaylist && (
            <form onSubmit={handleCreatePlaylist} className="mb-3 flex items-center gap-2">
              <input
                ref={createInputRef}
                type="text"
                placeholder="Tên playlist..."
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                className="flex-1 h-8 px-3 bg-[#2e3450] text-sm text-white rounded-lg border border-[#333] outline-none focus:border-[#7c83f5] transition-colors min-w-0"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim() || createLoading}
                className="h-8 px-3 bg-[#7c83f5] text-white text-xs font-semibold rounded-lg border-none cursor-pointer hover:bg-[#6670e8] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1"
              >
                {createDone ? <MdCheck size={14}/> : createLoading ? '...' : 'Tạo'}
              </button>
              <button
                type="button"
                onClick={() => { setCreatingPlaylist(false); setNewPlaylistName(''); }}
                className="h-8 px-2 text-[#9ca3af] text-xs bg-transparent border-none cursor-pointer hover:text-white shrink-0"
              >✕</button>
            </form>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
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

            {/* Favorites card (single, always first when visible) */}
            {!loading && showFav && (
              <LibraryItem
                isFav
                name="Bài hát yêu thích"
                sub={`${favCount} bài hát`}
                onClick={() => navigate('/library/favorites')}
              />
            )}

            {/* Playlists */}
            {!loading && showPlaylists && filteredPlaylists.length > 0 && (
              <>
                {tab === 'all' && <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1 mt-2">Playlist</p>}
                {filteredPlaylists.map(pl => (
                  <LibraryItem
                    key={pl._id}
                    isPlaylist
                    name={pl.name}
                    sub="Playlist"
                    onClick={() => navigate(`/playlist/${pl._id}`)}
                    onDelete={() => handleDeletePlaylist(pl._id)}
                  />
                ))}
              </>
            )}

            {/* Artists */}
            {!loading && showArtists && filteredArtists.length > 0 && (
              <>
                {tab === 'all' && <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1 mt-3">Nghệ sĩ</p>}
                {filteredArtists.map(a => (
                  <LibraryItem key={a._id} srcImg={a.imageUrl} name={a.name} sub="Nghệ sĩ" isArtist
                    onClick={() => navigate(`/artist/${a._id}`)}/>
                ))}
              </>
            )}

            {/* Albums */}
            {!loading && showAlbums && filteredAlbums.length > 0 && (
              <>
                {tab === 'all' && <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1 mt-3">Album</p>}
                {filteredAlbums.map(a => (
                  <LibraryItem key={a.id} srcImg={a.image} name={a.name} sub={`Album · ${a.singer}`}
                    onClick={() => navigate(`/album/${a.id}`)}/>
                ))}
              </>
            )}

            {/* Empty */}
            {!loading && noResults && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <MdLibraryMusic size={36} color="#6b7280"/>
                <p className="text-xs text-[#6b7280] m-0">
                  {query ? `Không tìm thấy "${query}"` : 'Thư viện trống'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Always visible */}
      <div className="pt-3 mt-auto border-t border-[#2e3450]">
        <button
          onClick={() => navigate('/room')}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs text-[#9ca3af] hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
        >
          <MdGroups size={17}/>
          Phòng nghe chung
        </button>
        <button
          onClick={() => navigate('/claims')}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs text-[#9ca3af] hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
        >
          <MdGavel size={15}/>
          Khiếu nại bản quyền
        </button>
      </div>
    </div>
  );
}
