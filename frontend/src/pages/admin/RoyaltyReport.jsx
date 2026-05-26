import { useEffect, useState } from "react";
import { MdAttachMoney } from "react-icons/md";
import { songAPI } from "../../services/api";

const PERIODS = [
  { value: "today", label: "Hôm nay" },
  { value: "week",  label: "7 ngày" },
  { value: "month", label: "Tháng này" },
  { value: "all",   label: "Tất cả" },
];

export default function RoyaltyReport() {
  const [period, setPeriod]   = useState("month");
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    songAPI.getRoyaltyReport(period)
      .then(res => setRows(res.data.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [period]);

  const totalStreams = rows.reduce((s, r) => s + r.streams, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white m-0">Thống kê bản quyền</h2>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors ${
                period === p.value
                  ? "bg-[#7c83f5] text-white"
                  : "bg-[#1a1f35] text-[#9ca3af] hover:text-white hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2e3450] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdAttachMoney size={18} className="text-[#7c83f5]"/>
            <h3 className="text-sm font-semibold text-white m-0">Lượt nghe theo chủ sở hữu</h3>
          </div>
          {!loading && (
            <span className="text-xs text-[#6b7280]">
              Tổng: <span className="text-white font-semibold">{totalStreams.toLocaleString()}</span> lượt nghe
            </span>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-5 py-3 text-left font-medium w-10">#</th>
              <th className="px-5 py-3 text-left font-medium">Chủ sở hữu</th>
              <th className="px-5 py-3 text-right font-medium">Số bài</th>
              <th className="px-5 py-3 text-right font-medium">Lượt nghe</th>
              <th className="px-5 py-3 text-right font-medium">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[#6b7280] text-sm">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[#6b7280] text-sm">
                  Chưa có dữ liệu lượt nghe trong kỳ này.
                </td>
              </tr>
            ) : rows.map((row, i) => {
              const pct = totalStreams > 0 ? (row.streams / totalStreams) * 100 : 0;
              return (
                <tr key={row.owner} className="border-t border-[#2e3450] hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-[#6b7280] text-sm">{i + 1}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-white font-medium">{row.owner}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#9ca3af] text-right">{row.songCount}</td>
                  <td className="px-5 py-3 text-sm text-white font-semibold text-right">
                    {row.streams.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-[#2e3450] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7c83f5] rounded-full"
                          style={{ width: `${pct.toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#9ca3af] w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <p className="text-xs text-[#6b7280] mt-3">
          * Lượt nghe được tính dựa trên lịch sử nghe thực tế. Dữ liệu dùng cho tính toán phí bản quyền.
        </p>
      )}
    </div>
  );
}
