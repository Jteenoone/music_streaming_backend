import { useEffect, useState } from 'react';
import SongCard from './SongCard';
import src_img from '../assets/images/img.jpg';
import { songAPI, normalizeSong } from '../services/api';

export default function FeaturedSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    songAPI.getTrending()
      .then(res => setSongs((res.data.data ?? []).map(normalizeSong)))
      .catch(() =>
        songAPI.getAll(1, 8)
          .then(res => setSongs((res.data.data ?? []).map(normalizeSong)))
          .catch(() => {})
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="text-white mt-6">
      <h3 className="text-[25px] mb-2.5">Bài hát nổi bật</h3>
      <div className="flex gap-[30px] items-stretch">
        <div className="flex-1 flex flex-col">
          {loading && (
            <p className="text-[#6b7280] text-sm py-4">Đang tải...</p>
          )}
          {!loading && songs.length === 0 && (
            <p className="text-[#6b7280] text-sm py-4">Chưa có bài hát nào.</p>
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
