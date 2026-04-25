import { createContext, useContext, useRef, useState, useEffect } from "react";
import { songAPI, userAPI, normalizeSong } from '../services/api';
import { useAuth } from './AuthContext';

const PlayerContext = createContext();

export function PlayerProvider({children}) {
    const { user } = useAuth();
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState('none');
    const [isQueuedContext, setIsQueuedContext] = useState(false);
    const [queueSourceId, setQueueSourceId] = useState(null);
    const [previewExpired, setPreviewExpired] = useState(false);
    const audioRef = useRef(new Audio());
    const userRef = useRef(user);
    userRef.current = user;

    const currentSong = currentIndex !== null ? queue[currentIndex] : null;

    const loadAndPlay = (song, newQueue, newIndex) => {
        if (newQueue) setQueue(newQueue);
        setCurrentIndex(newIndex);
        setIsPlaying(true);
        setPreviewExpired(false);
        audioRef.current.src = song.url;
        audioRef.current.load();
        audioRef.current.addEventListener('canplay', () => {
            audioRef.current.play();
        }, { once: true });
        if (song.id) {
            songAPI.play(song.id).catch(() => {});
            if (user) userAPI.recordPlay(song.id).catch(() => {});
        }
    };

    const playSong = (song, newQueue, sourceId = null) => {
        const targetQueue = newQueue || queue;
        const idx = targetQueue.findIndex(s => s.id === song.id);

        // Toggle play/pause nếu cùng bài, không đổi queue
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

        setIsQueuedContext(newQueue ? newQueue.length > 1 : false);
        if (newQueue) setQueueSourceId(sourceId);

        const finalIdx = idx === -1 ? 0 : idx;
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

    // Dùng ref để luôn đọc được giá trị mới nhất trong onended closure
    const queueRef = useRef(queue);
    const currentIndexRef = useRef(currentIndex);
    const repeatModeRef = useRef(repeatMode);
    const isQueuedContextRef = useRef(isQueuedContext);
    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    repeatModeRef.current = repeatMode;
    isQueuedContextRef.current = isQueuedContext;

    audioRef.current.onended = () => {
        const q = queueRef.current;
        const idx = currentIndexRef.current;
        const repeat = repeatModeRef.current;
        const hasContext = isQueuedContextRef.current;

        if (repeat === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            return;
        }

        if (repeat === 'all' || idx < q.length - 1) {
            // Còn bài trong queue → phát tiếp bình thường
            const nextIdx = (idx + 1) % q.length;
            loadAndPlay(q[nextIdx], undefined, nextIdx);
            return;
        }

        // Hết queue — nếu đang nghe lẻ (không có context album/artist) → fetch recommend
        if (!hasContext && q[idx]?.id) {
            // Truyền toàn bộ id đã có trong queue để không recommend lại bài cũ
            const playedIds = q.map(s => s.id).filter(Boolean);
            songAPI.recommend(q[idx].id, playedIds)
                .then(res => {
                    const recommended = (res.data.data ?? []).map(normalizeSong).filter(Boolean);
                    if (recommended.length > 0) {
                        // Thêm recommended vào queue và phát bài đầu tiên
                        const newQueue = [...q, ...recommended];
                        setQueue(newQueue);
                        loadAndPlay(recommended[0], undefined, idx + 1);
                    } else {
                        setIsPlaying(false);
                    }
                })
                .catch(() => setIsPlaying(false));
        } else {
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleTimeUpdate = () => {
            if (!userRef.current && audio.currentTime >= 30) {
                audio.pause();
                audio.currentTime = 30;
                setIsPlaying(false);
                setPreviewExpired(true);
            }
        };
        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentSong, isPlaying, playSong, audioRef,
            playNext, playPrev,
            isShuffle, repeatMode, toggleShuffle, toggleRepeat,
            queue, setQueue, queueSourceId,
            previewExpired, setPreviewExpired
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
