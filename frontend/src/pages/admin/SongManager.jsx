import { useState, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch } from "react-icons/md";
import { songAPI, normalizeSong } from "../../services/api";

function SongModal({ song, onSave, onClose }) {
  const [form, setForm] = useState(
    song
      ? { title: song.name, artistName: song.singer }
      : { title: "", artistName: "" }
  );
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onSave(form, audioFile, coverImage);
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
            {song ? "Chỉnh sửa bài hát" : "Thêm bài hát mới"}
          </h3>
          <button onClick={onClose} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white"><MdClose size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Tên bài hát *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Nhập tên bài hát" className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Tên nghệ sĩ *</label>
            <input name="artistName" value={form.artistName} onChange={handleChange} placeholder="Nhập tên nghệ sĩ" className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">
              File nhạc MP3 {!song && <span className="text-[#f87171]">*</span>}
              {song && <span className="text-[#6b7280]"> (để trống nếu không thay đổi)</span>}
            </label>
            <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files[0])}
              className="w-full text-sm text-[#9ca3af] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#2e3450] file:text-white file:cursor-pointer"/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">
              Ảnh bìa
              {song && <span className="text-[#6b7280]"> (để trống nếu không thay đổi)</span>}
            </label>
            <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files[0])}
              className="w-full text-sm text-[#9ca3af] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#2e3450] file:text-white file:cursor-pointer"/>
          </div>
          {error && <p className="text-xs text-[#f87171] m-0">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2e3450] text-sm text-[#9ca3af] bg-transparent cursor-pointer hover:bg-white/5 transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-[#7c83f5] text-white text-sm font-medium border-none cursor-pointer hover:bg-[#6670e8] transition-colors disabled:opacity-60">
              {loading ? "Đang lưu..." : (song ? "Lưu thay đổi" : "Thêm mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SongManager() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSongs = () => {
    setLoading(true);
    songAPI.getAll(1, 100)
      .then(res => setSongs((res.data.data ?? []).map(normalizeSong)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSongs(); }, []);

  const filtered = songs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.singer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (form, audioFile, coverImage) => {
    if (modal === "add") {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artistName", form.artistName);
      fd.append("duration", 0);
      fd.append("genre", "Other");
      if (audioFile) fd.append("audioFile", audioFile);
      if (coverImage) fd.append("coverImage", coverImage);
      await songAPI.create(fd);
    } else {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artistName", form.artistName);
      if (audioFile) fd.append("audioFile", audioFile);
      if (coverImage) fd.append("coverImage", coverImage);
      await songAPI.update(modal.id, fd);
    }
    setModal(null);
    fetchSongs();
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa bài hát này?")) return;
    try {
      await songAPI.delete(id);
      setSongs(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.message ?? "Xóa thất bại");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white m-0">Quản lý bài hát</h2>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-1.5 bg-[#7c83f5] text-white text-sm font-medium px-4 py-2 rounded-lg border-none cursor-pointer hover:bg-[#6670e8] transition-colors"
        >
          <MdAdd size={18}/> Thêm bài hát
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 mb-4 max-w-sm">
        <MdSearch size={18} color="#6b7280"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm bài hát..."
          className="bg-transparent border-none outline-none text-sm text-white placeholder-[#6b7280] w-full"
        />
      </div>

      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#6b7280] bg-[#232840]">
              <th className="px-5 py-3 text-left font-medium">Bài hát</th>
              <th className="px-5 py-3 text-left font-medium">Nghệ sĩ</th>
              <th className="px-5 py-3 text-right font-medium">Lượt nghe</th>
              <th className="px-5 py-3 text-right font-medium w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6b7280] text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6b7280] text-sm">Không tìm thấy bài hát</td></tr>
            ) : filtered.map(song => (
              <tr key={song.id} className="border-t border-[#2e3450] hover:bg-white/5 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {song.src_img && <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>}
                    <span className="text-sm text-white">{song.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#9ca3af]">{song.singer}</td>
                <td className="px-5 py-3 text-sm text-[#9ca3af] text-right">{(song.playCount ?? 0).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setModal(song)} className="p-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-[#9ca3af] hover:text-[#7c83f5] hover:bg-[#7c83f5]/10 transition-colors">
                      <MdEdit size={15}/>
                    </button>
                    <button onClick={() => handleDelete(song.id)} className="p-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors">
                      <MdDelete size={15}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#2e3450] text-xs text-[#6b7280]">
          {filtered.length} / {songs.length} bài hát
        </div>
      </div>

      {modal && (
        <SongModal
          song={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
