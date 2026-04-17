export default function AlbumCard({ src_img, name_album, name_singer, onClick }) {
    return (
        <div className="cursor-pointer group" onClick={onClick}>
            <div className="relative overflow-hidden rounded-lg">
                <img
                    src={src_img}
                    alt={name_album}
                    className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg"/>
            </div>
            <h4 className="text-sm font-semibold text-white mt-2 mb-0.5 truncate">{name_album || "loading..."}</h4>
            <p className="text-xs text-[#9ca3af] m-0 truncate">{name_singer || "loading..."}</p>
        </div>
    );
}
