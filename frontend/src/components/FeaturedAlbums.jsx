import { useEffect, useState } from 'react';
import AlbumCard from "./AlbumCard";
import { albumAPI, normalizeAlbum } from '../services/api';
import { useNavigate } from "react-router-dom";

export default function FeaturedAlbums() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        albumAPI.getAll()
            .then(res => setAlbums((res.data.data ?? []).map(normalizeAlbum)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="text-white mt-6">
            <h3 className="mt-5 mb-2.5 text-[25px]">Album nổi bật</h3>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {loading && (
                    <p className="text-[#6b7280] text-sm py-4 col-span-full">Đang tải...</p>
                )}
                {!loading && albums.length === 0 && (
                    <p className="text-[#6b7280] text-sm py-4 col-span-full">Chưa có album nào.</p>
                )}
                {albums.map((album) => (
                    <AlbumCard
                        key={album.id}
                        src_img={album.image}
                        name_album={album.name}
                        name_singer={album.singer}
                        onClick={() => navigate(`/album/${album.id}`)}
                    />
                ))}
            </div>
        </div>
    );
}
