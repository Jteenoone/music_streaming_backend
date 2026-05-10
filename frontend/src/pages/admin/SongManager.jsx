import { useState, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch } from "react-icons/md";
import { songAPI, normalizeSong } from "../../services/api";

function SongModal({ song, onSave, onClose }) {
  const [form, setForm] = useState(
    song
      ? {
          title: song.name,
          artistName: song.singer,
          isrc: song.isrc ?? "",
          iswc: song.iswc ?? "",
          copyrightOwner:    song.copyright?.owner     ?? "",
          copyrightLicense:  song.copyright?.license   ?? "All rights reserved",
          copyrightYear:     song.copyright?.year      ?? "",
          copyrightStatus:   song.copyright?.status    ?? "active",
          copyrightExpiresAt: song.copyright?.expiresAt
            ? new Date(song.copyright.expiresAt).toISOString().split("T")[0]
            : "",
        }
      : {
          title: "", artistName: "",
          isrc: "", iswc: "",
          copyrightOwner: "", copyrightLicense: "All rights reserved",
          copyrightYear: "", copyrightStatus: "active", copyrightExpiresAt: "",
        }
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

          {/* ── Mã định danh âm nhạc ── */}
          <div className="border border-[#2e3450] rounded-lg p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#a78bfa] m-0">Mã định danh âm nhạc</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  ISRC
                  <span className="text-[#6b7280] ml-1">(Bản ghi)</span>
                </label>
                <input
                  name="isrc" value={form.isrc} onChange={handleChange}
                  placeholder="VD: VNAM32400001"
                  className={inputCls}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  ISWC
                  <span className="text-[#6b7280] ml-1">(Tác phẩm)</span>
                </label>
                <input
                  name="iswc" value={form.iswc} onChange={handleChange}
                  placeholder="VD: T-123456789-0"
                  className={inputCls}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
            <p className="text-[10px] text-[#6b7280] m-0">
              ISRC xác định bản ghi âm • ISWC xác định tác phẩm âm nhạc (nhạc + lời)
            </p>
          </div>

          {/* ── Bản quyền ── */}
          <div className="border border-[#2e3450] rounded-lg p-3 flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#7c83f5] m-0">Thông tin bản quyền</p>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Chủ sở hữu</label>
              <input name="copyrightOwner" value={form.copyrightOwner} onChange={handleChange}
                placeholder="VD: Sony Music Entertainment" className={inputCls}/>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[#9ca3af] mb-1 block">Năm</label>
                <input name="copyrightYear" type="number" value={form.copyrightYear} onChange={handleChange}
                  placeholder="2024" className={inputCls}/>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#9ca3af] mb-1 block">Trạng thái</label>
                <select name="copyrightStatus" value={form.copyrightStatus} onChange={handleChange} className={inputCls}>
                  <option value="active">Đang hiệu lực</option>
                  <option value="expired">Hết hạn</option>
                  <option value="disputed">Đang tranh chấp</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Giấy phép</label>
              <select name="copyrightLicense" value={form.copyrightLicense} onChange={handleChange} className={inputCls}>
                <option>All rights reserved</option>
                <option>CC BY</option>
                <option>CC BY-SA</option>
                <option>CC BY-NC</option>
                <option>Public Domain</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Ngày hết hạn <span className="text-[#6b7280]">(để trống nếu không xác định)</span></label>
              <input name="copyrightExpiresAt" type="date" value={form.copyrightExpiresAt} onChange={handleChange} className={inputCls}/>
            </div>
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

// Loại tìm kiếm
const SEARCH_TYPES = [
  { value: 'name',   label: 'Tên bài hát / Nghệ sĩ' },
  { value: 'isrc',   label: 'ISRC' },
  { value: 'iswc',   label: 'ISWC' },
];

export default function SongManager() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name");
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

  const filtered = songs.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    switch (searchType) {
      case 'isrc': return (s.isrc ?? '').toLowerCase().includes(q);
      case 'iswc': return (s.iswc ?? '').toLowerCase().includes(q);
      default:
        return s.name.toLowerCase().includes(q) || s.singer.toLowerCase().includes(q);
    }
  });

  const handleSave = async (form, audioFile, coverImage) => {
    const buildCopyright = () => ({
      owner:     form.copyrightOwner,
      license:   form.copyrightLicense,
      year:      form.copyrightYear ? parseInt(form.copyrightYear) : undefined,
      status:    form.copyrightStatus,
      expiresAt: form.copyrightExpiresAt || undefined,
    });

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("artistName", form.artistName);
    if (form.isrc) fd.append("isrc", form.isrc);
    if (form.iswc) fd.append("iswc", form.iswc);
    fd.append("copyright", JSON.stringify(buildCopyright()));
    if (audioFile) fd.append("audioFile", audioFile);
    if (coverImage) fd.append("coverImage", coverImage);

    if (modal === "add") {
      fd.append("duration", 0);
      fd.append("genre", "Other");
      await songAPI.create(fd);
    } else {
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

      {/* Thanh tìm kiếm với dropdown loại */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={searchType}
          onChange={e => { setSearchType(e.target.value); setSearch(""); }}
          className="bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-xs text-[#9ca3af] outline-none focus:border-[#7c83f5] transition-colors cursor-pointer"
        >
          {SEARCH_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <MdSearch size={18} color="#6b7280"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              searchType === 'isrc' ? "Nhập mã ISRC (VD: VNAM32400001)..." :
              searchType === 'iswc' ? "Nhập mã ISWC (VD: T-123456789-0)..." :
              "Tìm kiếm bài hát hoặc nghệ sĩ..."
            }
            style={searchType !== 'name' ? { fontFamily: 'monospace' } : {}}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[#6b7280] w-full"
          />
          {search && (
            <button onClick={() => setSearch("")} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white p-0 leading-none">
              <MdClose size={15}/>
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#6b7280] bg-[#232840]">
              <th className="px-5 py-3 text-left font-medium">Bài hát</th>
              <th className="px-5 py-3 text-left font-medium">Nghệ sĩ</th>
              <th className="px-5 py-3 text-left font-medium">ISRC / ISWC</th>
              <th className="px-5 py-3 text-left font-medium">Bản quyền</th>
              <th className="px-5 py-3 text-right font-medium">Lượt nghe</th>
              <th className="px-5 py-3 text-right font-medium w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6b7280] text-sm">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6b7280] text-sm">Không tìm thấy bài hát</td></tr>
            ) : filtered.map(song => (
              <tr key={song.id} className="border-t border-[#2e3450] hover:bg-white/5 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {song.src_img && <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>}
                    <span className="text-sm text-white">{song.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#9ca3af]">{song.singer}</td>
                <td className="px-5 py-3">
                  {song.isrc ? (
                    <p className="text-[11px] font-mono text-[#a78bfa] m-0">{song.isrc}</p>
                  ) : null}
                  {song.iswc ? (
                    <p className="text-[11px] font-mono text-[#818cf8] m-0 mt-0.5">{song.iswc}</p>
                  ) : null}
                  {!song.isrc && !song.iswc && (
                    <span className="text-[11px] text-[#4b5563]">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {(() => {
                    const st = song.copyright?.status ?? 'active';
                    const cfg = {
                      active:   { label: 'Hiệu lực',   cls: 'bg-emerald-500/15 text-emerald-400' },
                      expired:  { label: 'Hết hạn',    cls: 'bg-red-500/15 text-red-400' },
                      disputed: { label: 'Tranh chấp', cls: 'bg-yellow-500/15 text-yellow-400' },
                    }[st] ?? { label: st, cls: 'bg-gray-500/15 text-gray-400' };
                    return (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                  {song.copyright?.owner && (
                    <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">{song.copyright.owner}</p>
                  )}
                </td>
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
