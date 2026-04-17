import { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { MdSkipPrevious, MdSkipNext } from "react-icons/md";
import { FaVolumeUp, FaVolumeMute, FaVolumeDown, FaPlay, FaPause, FaRandom } from "react-icons/fa";
import { TbRepeat, TbRepeatOnce } from "react-icons/tb";

export default function PlayerBar() {
  const { currentSong, isPlaying, playSong, audioRef, playNext, playPrev, isShuffle, repeatMode, toggleShuffle, toggleRepeat } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    setCurrentTime(0);
  }, [currentSong]);

  const togglePlay = () => {
    if (currentSong) playSong(currentSong);
  };

  const handleVolume = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    audioRef.current.volume = vol;
    if (vol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!currentSong) {
    return (
      <div className="flex h-[100px] items-center justify-center bg-[#1a1f35] border-t border-[#2e3450] text-[#6b7280] text-sm">
        Chọn một bài hát để bắt đầu nghe
      </div>
    );
  }

  return (
    <div className="flex h-[100px] items-center justify-between bg-[#1a1f35] border-t border-[#2e3450] px-6 text-white gap-4">
      {/* INFO */}
      <div className="flex items-center gap-3 w-[260px] min-w-0">
        <img src={currentSong.src_img} alt="ảnh nhạc" className="w-14 h-14 object-cover rounded-lg shrink-0"/>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="m-0 text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            {currentSong.name || 'Loading...'}
          </p>
          <small className="text-xs text-[#9ca3af]">{currentSong.singer || 'Loading...'}</small>
        </div>
      </div>

      {/* PLAY CONTROLS */}
      <div className="flex-1 flex flex-col items-center gap-2 max-w-[600px]">
        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            className={`bg-transparent border-none cursor-pointer flex items-center justify-center p-1.5 rounded-full transition-all duration-200 hover:bg-white/10 ${isShuffle ? 'text-[#7c83f5]' : 'text-white'}`}
          >
            <FaRandom size={15}/>
          </button>

          <button
            onClick={playPrev}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center p-1.5 rounded-full transition-all duration-200 hover:bg-white/10"
          >
            <MdSkipPrevious size={30} color="white"/>
          </button>

          <button
            onClick={togglePlay}
            className="bg-white rounded-full w-10 h-10 p-0 flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:bg-[#e5e7eb] hover:scale-105"
          >
            {isPlaying ? <FaPause size={18} color="#1a1f35"/> : <FaPlay size={18} color="#1a1f35"/>}
          </button>

          <button
            onClick={playNext}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center p-1.5 rounded-full transition-all duration-200 hover:bg-white/10"
          >
            <MdSkipNext size={30} color="white"/>
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            title={repeatMode === 'none' ? 'Tắt lặp' : repeatMode === 'all' ? 'Lặp tất cả' : 'Lặp 1 bài'}
            className={`bg-transparent border-none cursor-pointer flex items-center justify-center p-1.5 rounded-full transition-all duration-200 hover:bg-white/10 ${repeatMode !== 'none' ? 'text-[#7c83f5]' : 'text-white'}`}
          >
            {repeatMode === 'one' ? <TbRepeatOnce size={18}/> : <TbRepeat size={18}/>}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-xs text-[#9ca3af] whitespace-nowrap min-w-[36px] text-center">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-[#9ca3af] whitespace-nowrap min-w-[36px] text-center">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* VOLUME */}
      <div className="flex items-center gap-2.5 w-[180px] justify-end">
        <button
          onClick={toggleMute}
          className="bg-transparent border-none cursor-pointer flex items-center p-1 rounded-full transition-all duration-200 hover:bg-white/10"
        >
          {isMuted
            ? <FaVolumeMute size={20} color="white"/>
            : volume >= 0.5
              ? <FaVolumeUp size={20} color="white"/>
              : <FaVolumeDown size={20} color="white"/>
          }
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolume}
          className="w-[100px]"
        />
      </div>
    </div>
  );
}
