import { useEffect, useState } from 'react';
import AlbumCard from './AlbumCard';
import { songAPI, normalizeSong } from '../services/api';
import { usePlayer } from '../context/PlayerContext';

export default function DailyMix() {
  const [songs, setSongs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => {
    setLoading(true);
    songAPI.getDailyMix()
      .then((res) => {
        const list = (res.data.data ?? []).map(normalizeSong).filter(Boolean);
        setSongs(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || songs.length === 0) return null;

  return (
    <div className="text-white mt-6">
      <h3 className="mt-5 mb-2.5 text-[25px]">Gợi ý cho bạn hôm nay</h3>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {songs.map((song) => (
          <div key={song.id} className="shrink-0 w-[180px]">
            <AlbumCard
              albumId={song.id}
              src_img={song.src_img}
              name_album={song.name}
              name_singer={song.singer}
              onPlay={() => playSong(song, [song])}
              onClick={() => playSong(song, [song])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
