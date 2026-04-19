import { FaPlay, FaPause } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';

export default function AlbumCard({ src_img, name_album, name_singer, albumId, onPlay, onClick }) {
    const { currentSong, isPlaying, playSong, queueSourceId } = usePlayer();

    const isActive = albumId && queueSourceId === albumId && isPlaying;

    const handlePlay = (e) => {
        e.stopPropagation();
        if (isActive) {
            playSong(currentSong); // toggle pause
            return;
        }
        if (onPlay) onPlay();
    };

    return (
        <div className="cursor-pointer group" onClick={onClick}>
            <div className="relative overflow-hidden rounded-lg">
                <img
                    src={src_img}
                    alt={name_album}
                    className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 rounded-lg"/>

                {/* Play button overlay */}
                <button
                    onClick={handlePlay}
                    className={`absolute bottom-2 right-2 flex items-center justify-center w-11 h-11 rounded-full bg-[#7c83f5] border-none cursor-pointer shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[#6670e8] ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                    }`}
                >
                    {isActive && isPlaying
                        ? <FaPause color="white" size={16}/>
                        : <FaPlay color="white" size={16}/>
                    }
                </button>
            </div>
            <h4 className="text-sm font-semibold text-white mt-2 mb-0.5 truncate">{name_album || 'loading...'}</h4>
            <p className="text-xs text-[#9ca3af] m-0 truncate">{name_singer || 'loading...'}</p>
        </div>
    );
}
