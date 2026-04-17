import { useEffect, useState } from "react";
import { MdMusicNote, MdAlbum, MdPeople, MdHeadphones } from "react-icons/md";
import { songAPI, albumAPI, userAPI, normalizeSong } from "../../services/api";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white m-0">{value}</p>
        <p className="text-sm text-[#9ca3af] m-0">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [songCount, setSongCount]   = useState('—');
  const [albumCount, setAlbumCount] = useState('—');
  const [userCount, setUserCount]   = useState('—');
  const [trending, setTrending]     = useState([]);

  useEffect(() => {
    songAPI.getAll(1, 1).then(res => setSongCount(res.data.data?.length ?? '—')).catch(() => {});
    songAPI.getTrending().then(res => {
      const songs = (res.data.data ?? []).map(normalizeSong);
      setSongCount(prev => prev === '—' ? songs.length : prev);
      setTrending(songs.slice(0, 5));
    }).catch(() => {});
    albumAPI.getAll().then(res => setAlbumCount(res.data.total ?? res.data.data?.length ?? '—')).catch(() => {});
    userAPI.getAll().then(res => setUserCount(res.data.data?.length ?? '—')).catch(() => {});
  }, []);

  const stats = [
    { icon: <MdMusicNote size={22} color="white"/>, label: "Tổng bài hát",      value: songCount,  color: "bg-[#7c83f5]" },
    { icon: <MdAlbum size={22} color="white"/>,     label: "Tổng album",        value: albumCount, color: "bg-[#1db954]" },
    { icon: <MdPeople size={22} color="white"/>,    label: "Người dùng",        value: userCount,  color: "bg-[#f59e0b]" },
    { icon: <MdHeadphones size={22} color="white"/>,label: "Lượt nghe hôm nay", value: "—",        color: "bg-[#ef4444]" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 m-0">Dashboard</h2>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {stats.map(s => <StatCard key={s.label} {...s}/>)}
      </div>

      <div className="bg-[#1a1f35] border border-[#2e3450] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2e3450]">
          <h3 className="text-sm font-semibold text-white m-0">Bài hát được nghe nhiều nhất</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#6b7280]">
              <th className="px-5 py-3 text-left font-medium w-10">#</th>
              <th className="px-5 py-3 text-left font-medium">Tên bài hát</th>
              <th className="px-5 py-3 text-left font-medium">Nghệ sĩ</th>
              <th className="px-5 py-3 text-right font-medium">Lượt nghe</th>
            </tr>
          </thead>
          <tbody>
            {trending.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-[#6b7280] text-sm">Đang tải...</td></tr>
            ) : trending.map((song, i) => (
              <tr key={song.id} className="border-t border-[#2e3450] hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 text-[#6b7280] text-sm">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {song.src_img && <img src={song.src_img} alt="" className="w-9 h-9 rounded object-cover shrink-0"/>}
                    <span className="text-sm text-white">{song.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#9ca3af]">{song.singer}</td>
                <td className="px-5 py-3 text-sm text-[#9ca3af] text-right">{(song.playCount ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
