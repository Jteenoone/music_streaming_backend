import { useEffect, useState } from 'react';
import SongCard from './SongCard';
import src_img from '../assets/images/img.jpg';
import { songAPI, normalizeSong } from '../services/api';

const PERIODS = [
  { value: 'week',  label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all',   label: 'Tất cả' },
];

export default function FeaturedSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    setLoading(true);
    songAPI.getTrending(period)
      .then(res => setSongs((res.data.data ?? []).map(normalizeSong)))
      .catch(() =>
        songAPI.getAll(1, 8)
          .then(res => setSongs((res.data.data ?? []).map(normalizeSong)))
          .catch(() => {})
      )
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="text-white mt-6">
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-[25px] m-0">Bài hát nổi bật</h3>
        <div className="flex items-center gap-1.5 ml-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                period === p.value
                  ? 'bg-white text-[#1E2237] border-white font-semibold'
                  : 'border-[#444] bg-transparent text-[#9ca3af] hover:border-white hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-[30px] items-stretch">
        <div className="flex-1 flex flex-col">
          {loading && (
            <p className="text-[#6b7280] text-sm py-4">Đang tải...</p>
          )}
          {!loading && songs.length === 0 && (
            <p className="text-[#6b7280] text-sm py-4">Chưa có bài hát nào trong khoảng thời gian này.</p>
          )}
          {songs.slice(0, 4).map(item => (
            <SongCard key={item.id} item={item} queue={songs}/>
          ))}
        </div>
        <img src={src_img} alt="" className="w-[400px] h-full object-cover rounded-lg"/>
      </div>
    </div>
  );
}
