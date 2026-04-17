import { createContext, useContext, useRef, useState } from "react";
import { songAPI } from '../services/api';

const PlayerContext = createContext();

export function PlayerProvider({children}) {
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
    const audioRef = useRef(new Audio());

    const currentSong = currentIndex !== null ? queue[currentIndex] : null;

    const loadAndPlay = (song, newQueue, newIndex) => {
        if (newQueue) setQueue(newQueue);
        setCurrentIndex(newIndex);
        setIsPlaying(true);
        audioRef.current.src = song.url;
        audioRef.current.load();
        audioRef.current.addEventListener('canplay', () => {
            audioRef.current.play();
        }, { once: true });
        // Tăng lượt nghe sau khi bắt đầu phát
        if (song.id) {
            songAPI.play(song.id).catch(() => {});
        }
    };

    // playSong: play a specific song, optionally replacing the queue
    const playSong = (song, newQueue) => {
        const targetQueue = newQueue || queue;
        const idx = targetQueue.findIndex(s => s.id === song.id);

        // Toggle play/pause if same song and no queue change
        if (!newQueue && idx !== -1 && currentIndex === idx) {
            if (audioRef.current.paused) {
                audioRef.current.play();
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            return;
        }

        const finalIdx = idx === -1 ? 0 : idx;
        // Nếu không có queue mới và bài không có trong queue hiện tại → tạo queue 1 bài
        const queueToSet = newQueue ?? (idx === -1 ? [song] : undefined);
        loadAndPlay(song, queueToSet, finalIdx);
    };

    const playNext = () => {
        if (currentIndex === null || queue.length === 0) return;
        const nextIdx = isShuffle
            ? Math.floor(Math.random() * queue.length)
            : (currentIndex + 1) % queue.length;
        loadAndPlay(queue[nextIdx], undefined, nextIdx);
    };

    const playPrev = () => {
        if (currentIndex === null || queue.length === 0) return;
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        loadAndPlay(queue[prevIdx], undefined, prevIdx);
    };

    const toggleShuffle = () => setIsShuffle(prev => !prev);
    const toggleRepeat = () => setRepeatMode(prev =>
        prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
    );

    audioRef.current.onended = () => {
        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else if (repeatMode === 'all' || currentIndex < queue.length - 1) {
            playNext();
        } else {
            setIsPlaying(false);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentSong, isPlaying, playSong, audioRef,
            playNext, playPrev,
            isShuffle, repeatMode, toggleShuffle, toggleRepeat,
            queue, setQueue
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
