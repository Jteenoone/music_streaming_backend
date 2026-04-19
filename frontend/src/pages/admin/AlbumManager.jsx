import { useState, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdLibraryMusic } from "react-icons/md";
import { albumAPI, songAPI, normalizeAlbum, normalizeSong } from "../../services/api";

function AlbumModal({ album, onSave, onClose }) {
  const [form, setForm] = useState(
    album
      ? { title: album.name, artistId: album.artistId ?? "", coverImage: album.image, releaseYear: album.releaseYear ?? "" }
      : { title: "", artistId: "", coverImage: "", releaseYear: "" }
  );
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artistId.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onSave(form, coverFile);
    } catch (err) {
      setError(err.response?.data?.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white m-0">
            {album ? "Chỉnh sửa album" : "Thêm album mới"}
          </h3>
          <button onClick={onClose} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white"><MdClose size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Tên album *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Nhập tên album" className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">ID nghệ sĩ *</label>
            <input name="artistId" value={form.artistId} onChange={handleChange} placeholder="MongoDB ObjectId của nghệ sĩ" className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">
              Ảnh bìa {album && <span className="text-[#6b7280]">(chọn file hoặc nhập URL)</span>}
            </label>
            <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])}
              className="w-full text-sm text-[#9ca3af] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#2e3450] file:text-white file:cursor-pointer mb-2"/>
            <input name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="Hoặc nhập URL ảnh bìa..." className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Năm phát hành</label>
            <input name="releaseYear" type="number" value={form.releaseYear} onChange={handleChange} placeholder="2024" className={inputCls}/>
          </div>
          {error && <p className="text-xs text-[#f87171] m-0">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2e3450] text-sm text-[#9ca3af] bg-transparent cursor-pointer hover:bg-white/5 transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-[#7c83f5] text-white text-sm font-medium border-none cursor-pointer hover:bg-[#6670e8] transition-colors disabled:opacity-60">
              {loading ? "Đang lưu..." : (album ? "Lưu thay đổi" : "Thêm mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SongManageModal({ album, onClose }) {
  const [albumSongs, setAlbumSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // songId đang xử lý

  useEffect(() => {
    Promise.all([albumAPI.getById(album.id), songAPI.getAll(1, 200)])
      .then(([albRes, songRes]) => {
        const detail = albRes.data.data;
        setAlbumSongs(detail.songs ?? []);
        setAllSongs((songRes.data.data ?? []).map(normalizeSong));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [album.id]);

  const inAlbumIds = new Set(albumSongs.map(s => s._id?.toString() ?? s.id?.toString()));

  const handleAdd = async (song) => {
    setBusy(song.id);
    try {
      await albumAPI.addSong(album.id, song.id);
      const res = await albumAPI.getById(album.id);
      setAlbumSongs(res.data.data.songs ?? []);
    } catch (err) {
      alert(err.response?.data?.message ?? "Thêm thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (songId) => {
    setBusy(songId);
    try {
      await albumAPI.removeSong(album.id, songId);
      setAlbumSongs(prev => prev.filter(s => (s._id ?? s.id) !== songId));
    } catch (err) {
      alert(err.response?.data?.message ?? "Xóa thất bại");
    } finally {
      setBusy(null);
    }
  };

  const q = search.toLowerCase();
  const availableSongs = allSongs.filter(s =>
    !inAlbumIds.has(s.id) &&
    (s.name.toLowerCase().includes(q) || s.singer.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e3450] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white m-0">Quản lý bài hát</h3>
            <p className="text-xs text-[#9ca3af] m-0 mt-0.5">{album.name}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white"><MdClose size={20}/></button>
        </div>

        {loading ? (
          <p className="text-[#6b7280] text-sm text-center py-10">Đang tải...</p>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: bài hát đang có trong album */}
            <div className="flex-1 flex flex-col border-r border-[#2e3450] overflow-hidden">
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider px-4 pt-4 pb-2 shrink-0">
                Trong album ({albumSongs.length})
              </p>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {albumSongs.length === 0 ? (
                  <p className="text-xs text-[#6b7280] py-4 text-center">Chưa có bài hát nào</p>
                ) : albumSongs.map(s => {
                  const sid = s._id ?? s.id;
                  return (
                    <div key={sid} className="flex items-center gap-2.5 py-2 border-b border-[#2e3450]/50 last:border-0">
                      {s.coverImage
                        ? <img src={s.coverImage} alt="" className="w-8 h-8 rounded object-cover shrink-0"/>
                        : <div className="w-8 h-8 bg-[#2e3450] rounded shrink-0 flex items-center justify-center text-[#6b7280] text-xs">♪</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white m-0 truncate">{s.title ?? s.name}</p>
                        <p className="text-[11px] text-[#6b7280] m-0 truncate">{s.artist?.name ?? s.singer ?? ""}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(sid)}
                        disabled={busy === sid}
                        className="shrink-0 p-1 rounded bg-transparent border-none cursor-pointer text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors disabled:opacity-40"
                      >
                        <MdDelete size={15}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: tìm & thêm bài hát */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-2 shrink-0">
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Thêm bài hát</p>
                <div className="flex items-center gap-2 bg-[#232840] border border-[#2e3450] rounded-lg px-2.5 py-1.5">
                  <MdSearch size={15} color="#6b7280"/>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm bài hát..."
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-[#6b7280] w-full"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {availableSongs.length === 0 ? (
                  <p className="text-xs text-[#6b7280] py-4 text-center">
                    {search ? "Không tìm thấy" : "Tất cả bài hát đã có trong album"}
                  </p>
                ) : availableSongs.map(s => (
                  <div key={s.id} className="flex items-center gap-2.5 py-2 border-b border-[#2e3450]/50 last:border-0">
                    {s.src_img
                      ? <img src={s.src_img} alt="" className="w-8 h-8 rounded object-cover shrink-0"/>
                      : <div className="w-8 h-8 bg-[#2e3450] rounded shrink-0 flex items-center justify-center text-[#6b7280] text-xs">♪</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white m-0 truncate">{s.name}</p>
                      <p className="text-[11px] text-[#6b7280] m-0 truncate">{s.singer}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(s)}
                      disabled={busy === s.id}
                      className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#7c83f5]/20 text-[#7c83f5] border border-[#7c83f5]/40 cursor-pointer hover:bg-[#7c83f5] hover:text-white transition-colors disabled:opacity-40 border-none"
                    >
                      {busy === s.id ? "..." : "+ Thêm"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlbumManager() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);       // null | "add" | album object
  const [songModal, setSongModal] = useState(null); // null | album object
  const [loading, setLoading] = useState(true);

  const fetchAlbums = () => {
    setLoading(true);
    albumAPI.getAll()
      .then(res => setAlbums((res.data.data ?? []).map(normalizeAlbum)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlbums(); }, []);

  const filtered = albums.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.singer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form, coverFile) => {
    if (coverFile) {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artist", form.artistId);
      if (form.releaseYear) fd.append("releaseYear", form.releaseYear);
      fd.append("coverImage", coverFile);
      if (modal === "add") await albumAPI.create(fd);
      else await albumAPI.update(modal.id, fd);
    } else {
      const payload = {
        title: form.title,
        artist: form.artistId,
        coverImage: form.coverImage,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
      };
      if (modal === "add") await albumAPI.create(payload);
      else await albumAPI.update(modal.id, payload);
    }
    setModal(null);
    fetchAlbums();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa album này?")) return;
    try {
      await albumAPI.delete(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message ?? "Xóa thất bại");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white m-0">Quản lý album</h2>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-1.5 bg-[#7c83f5] text-white text-sm font-medium px-4 py-2 rounded-lg border-none cursor-pointer hover:bg-[#6670e8] transition-colors"
        >
          <MdAdd size={18}/> Thêm album
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 mb-4 max-w-sm">
        <MdSearch size={18} color="#6b7280"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm album..."
          className="bg-transparent border-none outline-none text-sm text-white placeholder-[#6b7280] w-full"
        />
      </div>

      {loading ? (
        <p className="text-[#6b7280] text-sm py-8 text-center">Đang tải...</p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
          {filtered.length === 0 ? (
            <p className="text-[#6b7280] text-sm col-span-full py-8 text-center">Không tìm thấy album</p>
          ) : filtered.map(album => (
            <div key={album.id} className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden hover:border-[#7c83f5]/40 transition-colors">
              {album.image && <img src={album.image} alt={album.name} className="w-full aspect-square object-cover"/>}
              <div className="p-3">
                <p className="text-sm font-semibold text-white m-0 truncate">{album.name}</p>
                <p className="text-xs text-[#9ca3af] m-0 mt-0.5">{album.singer}</p>
                <p className="text-xs text-[#6b7280] m-0 mt-0.5">{album.songs.length} bài hát</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <button
                    onClick={() => setSongModal(album)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-xs text-[#9ca3af] hover:text-[#7c83f5] hover:bg-[#7c83f5]/10 transition-colors"
                  >
                    <MdLibraryMusic size={13}/> Bài hát
                  </button>
                  <button
                    onClick={() => setModal(album)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-xs text-[#9ca3af] hover:text-[#7c83f5] hover:bg-[#7c83f5]/10 transition-colors"
                  >
                    <MdEdit size={13}/> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(album.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-xs text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                  >
                    <MdDelete size={13}/> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <AlbumModal
          album={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {songModal && (
        <SongManageModal
          album={songModal}
          onClose={() => { setSongModal(null); fetchAlbums(); }}
        />
      )}
    </div>
  );
}
