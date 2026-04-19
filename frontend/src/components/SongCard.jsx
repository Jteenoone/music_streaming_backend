import { FaPlay, FaPause } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';

export default function SongCard({ item, queue }) {
    const { playSong, currentSong, isPlaying, queueSourceId } = usePlayer();
    const navigate = useNavigate();
    if (!item) return null;

    // Chỉ active khi đang phát bài này VÀ không phải đang phát từ album/artist khác
    const isActive = currentSong?.id === item.id && !queueSourceId;

    const handlePlay = (e) => {
        e.stopPropagation();
        // Nếu đang active → toggle play/pause (không truyền queue)
        if (isActive) { playSong(item); return; }
        playSong(item, queue);
    };

    return (
        <div className="group flex justify-between items-center px-2.5 py-2.5 border-b border-white/10 text-white bg-[#272D43] hover:bg-[#2d3352] transition-colors duration-150">
            <img
                src={item.src_img}
                alt="avatar"
                className="w-[45px] h-[45px] rounded-md object-cover shrink-0 cursor-pointer"
                onClick={handlePlay}
            />
            <div className="flex-1 px-3 min-w-0">
                <h4 className="text-sm font-medium m-0 truncate cursor-pointer text-white" onClick={handlePlay}>
                    {item.name ?? 'Loading...'}
                </h4>
                <p
                    className="text-xs text-[#9ca3af] m-0 truncate cursor-pointer hover:underline"
                    onClick={() => item.artistId && navigate(`/artist/${item.artistId}`)}
                >
                    {item.singer ?? 'Loading...'}
                </p>
            </div>

            {/* Nút play: luôn hiện khi đang active, chỉ hiện khi hover nếu không active */}
            <button
                onClick={handlePlay}
                className={`flex justify-center items-center rounded-full bg-[#323750] w-10 h-10 cursor-pointer hover:bg-white/10 border-none shrink-0 transition-opacity duration-150 ${
                    isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                {isActive && isPlaying
                    ? <FaPause color="white" size={14}/>
                    : <FaPlay color="white" size={14}/>
                }
            </button>
        </div>
    );
}
