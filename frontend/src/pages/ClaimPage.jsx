import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdGavel, MdSend, MdClose } from "react-icons/md";
import { claimAPI, songAPI, normalizeSong } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CFG = {
  pending:  { label: "Chờ xử lý",  cls: "bg-yellow-500/15 text-yellow-400"  },
  approved: { label: "Đã duyệt",   cls: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Đã từ chối", cls: "bg-red-500/15 text-red-400"        },
};

function SongSearchPicker({ onSelect }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await songAPI.search(keyword);
        setResults((res.data.data ?? []).map(normalizeSong).slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="relative">
      <input
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        placeholder="Tìm bài hát theo tên hoặc nghệ sĩ..."
        className="w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors"
      />
      {(results.length > 0 || searching) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1f35] border border-[#2e3450] rounded-xl shadow-2xl z-20 overflow-hidden">
          {searching && <p className="text-xs text-[#6b7280] px-4 py-3">Đang tìm...</p>}
          {results.map(s => (
            <button key={s.id} type="button"
              onClick={() => { onSelect(s); setKeyword(""); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-none bg-transparent cursor-pointer border-t border-[#2e3450] first:border-t-0"
            >
              {s.src_img && <img src={s.src_img} alt="" className="w-8 h-8 rounded object-cover shrink-0"/>}
              <div className="min-w-0">
                <p className="text-sm text-white m-0 truncate">{s.name}</p>
                <p className="text-xs text-[#9ca3af] m-0">{s.singer}</p>
              </div>
              {s.isrc && <span className="text-[10px] font-mono text-[#a78bfa] ml-auto shrink-0">{s.isrc}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClaimPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myClaims, setMyClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  const [selectedSong, setSelectedSong] = useState(null);
  const [form, setForm] = useState({ isrc: "", iswc: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchMyClaims = () => {
    if (!user) return;
    setLoadingClaims(true);
    claimAPI.getMy()
      .then(res => setMyClaims(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingClaims(false));
  };

  useEffect(() => { fetchMyClaims(); }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <MdGavel size={48} color="#6b7280"/>
        <p className="text-[#9ca3af] text-sm">Bạn cần đăng nhập để gửi khiếu nại bản quyền.</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#7c83f5] text-white text-sm px-5 py-2 rounded-full border-none cursor-pointer hover:bg-[#6670e8] transition-colors"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSong) { setSubmitError("Vui lòng chọn bài hát cần khiếu nại"); return; }
    if (!form.description.trim()) { setSubmitError("Vui lòng mô tả lý do khiếu nại"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await claimAPI.create({
        songId: selectedSong.id,
        isrc: form.isrc.trim(),
        iswc: form.iswc.trim(),
        description: form.description.trim(),
      });
      setSubmitSuccess(true);
      setSelectedSong(null);
      setForm({ isrc: "", iswc: "", description: "" });
      fetchMyClaims();
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? "Có lỗi xảy ra, thử lại sau");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors";

  return (
    <div className="max-w-2xl mx-auto py-2">
      <div className="flex items-center gap-3 mb-6">
        <MdGavel size={24} color="#7c83f5"/>
        <h2 className="text-xl font-bold text-white m-0">Khiếu nại bản quyền</h2>
      </div>

      {/* Form gửi khiếu nại */}
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4 m-0">Gửi khiếu nại mới</h3>

        {submitSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-emerald-400 m-0">Khiếu nại đã được gửi thành công! Chúng tôi sẽ xem xét trong thời gian sớm nhất.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#9ca3af] mb-1.5 block">Bài hát cần khiếu nại *</label>
            {selectedSong ? (
              <div className="flex items-center gap-3 bg-[#232840] border border-[#7c83f5]/40 rounded-lg px-3 py-2">
                {selectedSong.src_img && <img src={selectedSong.src_img} alt="" className="w-8 h-8 rounded object-cover shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white m-0 truncate">{selectedSong.name}</p>
                  <p className="text-xs text-[#9ca3af] m-0">{selectedSong.singer}</p>
                </div>
                <button type="button" onClick={() => setSelectedSong(null)}
                  className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white shrink-0">
                  <MdClose size={16}/>
                </button>
              </div>
            ) : (
              <SongSearchPicker onSelect={setSelectedSong}/>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[#9ca3af] mb-1.5 block">
                Mã ISRC của bạn
                <span className="text-[#6b7280] ml-1">(xác định bản ghi)</span>
              </label>
              <input name="isrc" value={form.isrc} onChange={handleChange}
                placeholder="VD: VNAM32400001" style={{ fontFamily: 'monospace' }}
                className={inputCls}/>
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#9ca3af] mb-1.5 block">
                Mã ISWC của bạn
                <span className="text-[#6b7280] ml-1">(xác định tác phẩm)</span>
              </label>
              <input name="iswc" value={form.iswc} onChange={handleChange}
                placeholder="VD: T-123456789-0" style={{ fontFamily: 'monospace' }}
                className={inputCls}/>
            </div>
          </div>
          <p className="text-[10px] text-[#6b7280] m-0 -mt-2">
            Cung cấp ít nhất một mã ISRC hoặc ISWC để tăng độ tin cậy của khiếu nại.
          </p>

          <div>
            <label className="text-xs text-[#9ca3af] mb-1.5 block">Mô tả lý do khiếu nại *</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={4} placeholder="Mô tả chi tiết: bạn là tác giả / chủ sở hữu bản quyền, bài hát vi phạm như thế nào..."
              className={`${inputCls} resize-none`}/>
          </div>

          {submitError && <p className="text-xs text-[#f87171] m-0">{submitError}</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-[#7c83f5] text-white text-sm font-medium px-5 py-2.5 rounded-lg border-none cursor-pointer hover:bg-[#6670e8] transition-colors disabled:opacity-60"
            >
              <MdSend size={15}/>
              {submitting ? "Đang gửi..." : "Gửi khiếu nại"}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách khiếu nại của tôi */}
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2e3450]">
          <h3 className="text-sm font-semibold text-white m-0">Khiếu nại của tôi</h3>
        </div>
        {loadingClaims ? (
          <p className="text-sm text-[#6b7280] px-5 py-8 text-center">Đang tải...</p>
        ) : myClaims.length === 0 ? (
          <p className="text-sm text-[#6b7280] px-5 py-8 text-center">Bạn chưa có khiếu nại nào</p>
        ) : (
          <div className="divide-y divide-[#2e3450]">
            {myClaims.map(claim => {
              const cfg = STATUS_CFG[claim.status] ?? { label: claim.status, cls: 'bg-gray-500/15 text-gray-400' };
              return (
                <div key={claim._id} className="px-5 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium m-0 truncate">
                        {claim.song?.title ?? "—"}
                      </p>
                      <p className="text-[11px] text-[#6b7280] m-0">
                        {new Date(claim.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {(claim.isrc || claim.iswc) && (
                    <div className="flex gap-3">
                      {claim.isrc && <span className="text-[11px] font-mono text-[#a78bfa]">ISRC: {claim.isrc}</span>}
                      {claim.iswc && <span className="text-[11px] font-mono text-[#818cf8]">ISWC: {claim.iswc}</span>}
                    </div>
                  )}
                  <p className="text-xs text-[#9ca3af] m-0 line-clamp-2">{claim.description}</p>
                  {claim.adminNote && (
                    <div className="bg-[#232840] rounded-lg px-3 py-2">
                      <p className="text-[10px] text-[#6b7280] m-0 mb-0.5">Phản hồi từ Admin:</p>
                      <p className="text-xs text-[#9ca3af] m-0">{claim.adminNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
