import { FaPlay, FaPause } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';

export default function SongCard({ item }) {
    const { playSong, currentSong, isPlaying } = usePlayer();
    if (!item) return null;

    const isActive = currentSong?.id === item.id;

    return (
        <div className={`flex justify-between items-center px-2.5 py-2.5 border-b border-white/10 text-white transition-colors duration-150 cursor-pointer ${isActive ? 'bg-[#323750]' : 'bg-[#272D43] hover:bg-[#2d3352]'}`}>
            <img src={item.src_img} alt="avatar" className="w-[45px] h-[45px] rounded-md object-cover shrink-0"/>
            <div className="flex-1 px-3 min-w-0">
                <h4 className={`text-sm font-medium m-0 truncate ${isActive ? 'text-[#7c83f5]' : 'text-white'}`}>
                    {item.name ?? "Loading..."}
                </h4>
                <p className="text-xs text-[#9ca3af] m-0 truncate">{item.singer ?? "Loading..."}</p>
            </div>
            <button
                onClick={() => playSong(item)}
                className="flex justify-center items-center rounded-full bg-[#323750] w-10 h-10 cursor-pointer hover:bg-white/10 border-none shrink-0"
            >
                {isActive && isPlaying ? <FaPause color="white" size={14}/> : <FaPlay color="white" size={14}/>}
            </button>
        </div>
    );
}
