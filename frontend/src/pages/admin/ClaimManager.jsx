import { useState, useEffect, useCallback } from "react";
import { MdClose, MdCheckCircle, MdCancel, MdRefresh } from "react-icons/md";
import { claimAPI } from "../../services/api";

const STATUS_TABS = [
  { value: "",         label: "Tất cả" },
  { value: "pending",  label: "Chờ xử lý" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
];

const STATUS_CFG = {
  pending:  { label: "Chờ xử lý",   cls: "bg-yellow-500/15 text-yellow-400"  },
  approved: { label: "Đã duyệt",    cls: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Đã từ chối",  cls: "bg-red-500/15 text-red-400"        },
};

function ResolveModal({ claim, onClose, onResolved }) {
  const [action, setAction] = useState("approved");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await claimAPI.resolve(claim._id, { action, adminNote: note });
      onResolved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#232840] border border-[#2e3450] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7c83f5] transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white m-0">Xử lý khiếu nại</h3>
          <button onClick={onClose} className="bg-transparent border-none text-[#6b7280] cursor-pointer hover:text-white"><MdClose size={20}/></button>
        </div>

        {/* Thông tin khiếu nại */}
        <div className="bg-[#232840] rounded-lg p-3 mb-4 flex flex-col gap-1.5">
          <p className="text-xs text-[#9ca3af] m-0">
            Bài hát: <span className="text-white font-medium">{claim.song?.title ?? "—"}</span>
          </p>
          <p className="text-xs text-[#9ca3af] m-0">
            Người khiếu nại: <span className="text-white">{claim.claimant?.username} ({claim.claimant?.email})</span>
          </p>
          {claim.isrc && (
            <p className="text-xs text-[#9ca3af] m-0">
              ISRC: <span className="font-mono text-[#a78bfa]">{claim.isrc}</span>
            </p>
          )}
          {claim.iswc && (
            <p className="text-xs text-[#9ca3af] m-0">
              ISWC: <span className="font-mono text-[#818cf8]">{claim.iswc}</span>
            </p>
          )}
          <p className="text-xs text-[#9ca3af] m-0 mt-1">Mô tả:</p>
          <p className="text-xs text-white m-0 bg-[#1a1f35] rounded p-2">{claim.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#9ca3af] mb-2 block">Quyết định</label>
            <div className="flex gap-3">
              {[
                { v: "approved", label: "Duyệt — Ẩn bài hát", cls: action === "approved" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-[#2e3450] text-[#6b7280]" },
                { v: "rejected", label: "Từ chối",              cls: action === "rejected" ? "border-red-500 bg-red-500/10 text-red-400"             : "border-[#2e3450] text-[#6b7280]" },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setAction(opt.v)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium cursor-pointer bg-transparent transition-colors ${opt.cls}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Ghi chú Admin <span className="text-[#6b7280]">(không bắt buộc)</span></label>
            <textarea name="note" value={note} onChange={e => setNote(e.target.value)}
              rows={3} placeholder="Lý do duyệt / từ chối..."
              className={`${inputCls} resize-none`}/>
          </div>
          {error && <p className="text-xs text-[#f87171] m-0">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#2e3450] text-sm text-[#9ca3af] bg-transparent cursor-pointer hover:bg-white/5 transition-colors">Hủy</button>
            <button type="submit" disabled={loading}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-60 ${
                action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "Đang xử lý..." : (action === "approved" ? "Duyệt & Ẩn bài hát" : "Từ chối")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClaimManager() {
  const [claims, setClaims] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [pagination, setPagination] = useState({ total: 0 });

  const fetchClaims = useCallback(() => {
    setLoading(true);
    claimAPI.getAll({ status: statusFilter || undefined, limit: 50 })
      .then(res => {
        setClaims(res.data.claims ?? []);
        setPagination(res.data.pagination ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white m-0">Khiếu nại bản quyền</h2>
        <button onClick={fetchClaims} className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white bg-[#232840] border border-[#2e3450] px-3 py-2 rounded-lg cursor-pointer transition-colors">
          <MdRefresh size={16}/> Làm mới
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? "bg-[#7c83f5] border-[#7c83f5] text-white"
                : "bg-transparent border-[#2e3450] text-[#9ca3af] hover:border-[#7c83f5] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#6b7280]">{pagination.total ?? claims.length} khiếu nại</span>
      </div>

      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#6b7280] bg-[#232840]">
              <th className="px-5 py-3 text-left font-medium">Người khiếu nại</th>
              <th className="px-5 py-3 text-left font-medium">Bài hát</th>
              <th className="px-5 py-3 text-left font-medium">Mã ISRC / ISWC</th>
              <th className="px-5 py-3 text-left font-medium">Mô tả</th>
              <th className="px-5 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-5 py-3 text-left font-medium">Ngày gửi</th>
              <th className="px-5 py-3 text-right font-medium w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[#6b7280] text-sm">Đang tải...</td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[#6b7280] text-sm">Không có khiếu nại nào</td></tr>
            ) : claims.map(claim => {
              const cfg = STATUS_CFG[claim.status] ?? { label: claim.status, cls: 'bg-gray-500/15 text-gray-400' };
              return (
                <tr key={claim._id} className="border-t border-[#2e3450] hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm text-white m-0">{claim.claimant?.username ?? "—"}</p>
                    <p className="text-[11px] text-[#6b7280] m-0">{claim.claimant?.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-white m-0">{claim.song?.title ?? "—"}</p>
                    {(claim.song?.isrc || claim.song?.iswc) && (
                      <p className="text-[10px] font-mono text-[#6b7280] m-0">
                        {claim.song.isrc || claim.song.iswc}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {claim.isrc && <p className="text-[11px] font-mono text-[#a78bfa] m-0">{claim.isrc}</p>}
                    {claim.iswc && <p className="text-[11px] font-mono text-[#818cf8] m-0 mt-0.5">{claim.iswc}</p>}
                    {!claim.isrc && !claim.iswc && <span className="text-[11px] text-[#4b5563]">—</span>}
                  </td>
                  <td className="px-5 py-3 max-w-[220px]">
                    <p className="text-xs text-[#9ca3af] m-0 line-clamp-2">{claim.description}</p>
                    {claim.adminNote && (
                      <p className="text-[10px] text-[#6b7280] m-0 mt-1 italic">Admin: {claim.adminNote}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[11px] text-[#6b7280]">
                    {new Date(claim.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {claim.status === "pending" ? (
                        <>
                          <button
                            onClick={() => setResolveTarget(claim)}
                            title="Duyệt"
                            className="p-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-[#9ca3af] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <MdCheckCircle size={15}/>
                          </button>
                          <button
                            onClick={() => setResolveTarget({ ...claim, _forceReject: true })}
                            title="Từ chối"
                            className="p-1.5 rounded-lg bg-[#2e3450] border-none cursor-pointer text-[#9ca3af] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <MdCancel size={15}/>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-[#4b5563]">Đã xử lý</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#2e3450] text-xs text-[#6b7280]">
          Hiển thị {claims.length} khiếu nại
        </div>
      </div>

      {resolveTarget && (
        <ResolveModal
          claim={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={fetchClaims}
        />
      )}
    </div>
  );
}
