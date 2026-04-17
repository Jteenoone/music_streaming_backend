export function TrackItem({ srcImg, nameSong, nameSinger }) {
    return (
        <div className="flex items-center gap-3">
            <img src={srcImg} alt="" className="w-[46px] h-[46px] object-cover rounded"/>
            <div className="min-w-0">
                <p className="text-sm text-white m-0 truncate">{nameSong}</p>
                <p className="text-xs text-[#9ca3af] m-0 truncate">{nameSinger}</p>
            </div>
        </div>
    );
}
