import { useState, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch } from "react-icons/md";
import { FaUserAlt } from "react-icons/fa";
import { artistAPI } from "../../services/api";

function ArtistModal({ artist, onSave, onClose }) {
  const [form, setForm] = useState(
    artist
      ? { name: artist.name, imageUrl: artist.imageUrl ?? '', bio: artist.bio ?? '', nationality: artist.nationality ?? '' }
      : { name: '', imageUrl: '', bio: '', nationality: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.message ?? 'Có lỗi xảy ra'); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white m-0">{artist ? 'Chỉnh sửa nghệ sĩ' : 'Thêm nghệ sĩ mới'}</h3>
          <button onClick={onClose} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white"><MdClose size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Tên nghệ sĩ *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Nhập tên nghệ sĩ" className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">URL ảnh</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Quốc tịch</label>
            <input name="nationality" value={form.nationality} onChange={handleChange} placeholder="Việt Nam, Hàn Quốc..." className={inputCls}/>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Tiểu sử</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Mô tả về nghệ sĩ..." rows={3}
              className={inputCls + ' resize-none'}/>
          </div>
          {error && <p className="text-xs text-[#f87171] m-0">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#9ca3af] bg-transparent border border-[#2e3450] rounded-lg cursor-pointer hover:bg-white/5">Huỷ</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-[#7c83f5] border-none rounded-lg cursor-pointer hover:bg-[#6670e8] disabled:opacity-60">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArtistManager() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | artist object
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchArtists = () => {
    setLoading(true);
    artistAPI.getAll()
      .then(res => setArtists(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArtists(); }, []);

  const handleSave = async (form) => {
    if (modal === 'add') {
      await artistAPI.create(form);
    } else {
      await artistAPI.update(modal._id, form);
    }
    setModal(null);
    fetchArtists();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await artistAPI.delete(deleteTarget._id);
    setDeleteTarget(null);
    fetchArtists();
  };

  const filtered = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Quản lý nghệ sĩ</h2>
          <p className="text-sm text-[#6b7280] m-0 mt-0.5">{artists.length} nghệ sĩ</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 bg-[#7c83f5] text-white text-sm font-medium px-4 py-2 rounded-lg border-none cursor-pointer hover:bg-[#6670e8] transition-colors"
        >
          <MdAdd size={18}/> Thêm nghệ sĩ
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#1a1f35] border border-[#2e3450] rounded-lg px-3 py-2 mb-4 max-w-[320px]">
        <MdSearch size={18} color="#6b7280"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm nghệ sĩ..."
          className="bg-transparent border-none outline-none text-sm text-white placeholder-[#6b7280] w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2e3450]">
              <th className="text-left text-xs text-[#6b7280] font-medium px-4 py-3 w-12">#</th>
              <th className="text-left text-xs text-[#6b7280] font-medium px-4 py-3">Nghệ sĩ</th>
              <th className="text-left text-xs text-[#6b7280] font-medium px-4 py-3 hidden md:table-cell">Quốc tịch</th>
              <th className="text-left text-xs text-[#6b7280] font-medium px-4 py-3 hidden lg:table-cell">Tiểu sử</th>
              <th className="text-right text-xs text-[#6b7280] font-medium px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center text-sm text-[#6b7280] py-10">Đang tải...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-sm text-[#6b7280] py-10">Không có nghệ sĩ nào</td></tr>
            )}
            {filtered.map((a, idx) => (
              <tr key={a._id} className="border-b border-[#2e3450]/50 hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-3 text-sm text-[#6b7280]">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {a.imageUrl
                      ? <img src={a.imageUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover shrink-0"/>
                      : <div className="w-10 h-10 rounded-full bg-[#2e3450] flex items-center justify-center shrink-0"><FaUserAlt size={16} color="#6b7280"/></div>
                    }
                    <span className="text-sm text-white font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#9ca3af] hidden md:table-cell">{a.nationality || '—'}</td>
                <td className="px-4 py-3 text-sm text-[#9ca3af] hidden lg:table-cell max-w-[200px] truncate">{a.bio || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setModal(a)} className="p-1.5 rounded-lg bg-transparent border-none text-[#6b7280] hover:text-[#7c83f5] hover:bg-[#7c83f5]/10 cursor-pointer transition-colors"><MdEdit size={16}/></button>
                    <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg bg-transparent border-none text-[#6b7280] hover:text-[#f87171] hover:bg-[#f87171]/10 cursor-pointer transition-colors"><MdDelete size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <ArtistModal
          artist={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-semibold text-white m-0 mb-2">Xác nhận xoá</h3>
            <p className="text-sm text-[#9ca3af] m-0 mb-5">Xoá nghệ sĩ <span className="text-white font-medium">"{deleteTarget.name}"</span>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-[#9ca3af] bg-transparent border border-[#2e3450] rounded-lg cursor-pointer hover:bg-white/5">Huỷ</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm text-white bg-[#f87171] border-none rounded-lg cursor-pointer hover:bg-[#ef4444]">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
