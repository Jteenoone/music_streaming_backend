import { createContext, useContext, useRef, useState, useEffect } from "react";
import { songAPI, userAPI, normalizeSong } from '../services/api';
import { useAuth } from './AuthContext';

const PlayerContext = createContext();

// Fisher-Yates: trả về mảng MỚI đã xáo trộn (không mutate mảng gốc)
const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

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

    const queueRef = useRef(queue);
    // Lưu thứ tự queue GỐC khi bật shuffle (null = đang không shuffle) để khôi phục khi tắt
    const originalQueueRef = useRef(null);
    const currentIndexRef = useRef(currentIndex);
    const repeatModeRef = useRef(repeatMode);
    const isQueuedContextRef = useRef(isQueuedContext);
    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    repeatModeRef.current = repeatMode;
    isQueuedContextRef.current = isQueuedContext;

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

        // Mở một queue mới (album/playlist/danh sách gợi ý)
        if (newQueue) {
            setQueueSourceId(sourceId);
            setIsQueuedContext(newQueue.length > 1);

            // Đang bật shuffle → xáo queue mới, giữ bài được chọn lên đầu
            if (isShuffle && newQueue.length > 1) {
                originalQueueRef.current = newQueue;                       // nhớ thứ tự gốc
                const rest = shuffleArray(newQueue.filter(s => s.id !== song.id));
                loadAndPlay(song, [song, ...rest], 0);
            } else {
                originalQueueRef.current = null;                          // context mới, chưa shuffle
                loadAndPlay(song, newQueue, idx === -1 ? 0 : idx);
            }
            return;
        }

        // Không kèm queue: bài đã có trong queue thì phát tại đó
        if (idx !== -1) {
            loadAndPlay(song, undefined, idx);
            return;
        }

        // Bài lẻ chưa có trong queue → tạo queue 1 bài
        originalQueueRef.current = null;
        loadAndPlay(song, [song], 0);
    };

    const handleNext = async () => {
        const q = queueRef.current;
        const idx = currentIndexRef.current;
        const repeat = repeatModeRef.current;
        const hasContext = isQueuedContextRef.current;

        if(repeat === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            return;
        }

        // Còn bài hát trong queue
        if(repeat === 'all' || idx < q.length - 1) {
            const nextIdx = (idx + 1) % q.length;
            loadAndPlay(q[nextIdx], undefined, nextIdx);
            return;
        }

        //fetch recommend
        if(!hasContext && q[idx]?.id) {
            const playedIds = q.slice(-20).map(s => s.id).filter(Boolean);
            try {
                const res = await songAPI.recommend(q[idx].id, playedIds);
                const recommended = (res.data.data ?? []).map(normalizeSong).filter(Boolean);
                if(recommended.length > 0) {
                    const newQueue = [...q, ...recommended];
                    setQueue(newQueue);
                    // Nếu đang shuffle, nối bài gợi ý vào cả thứ tự gốc để khôi phục đúng khi tắt
                    if (originalQueueRef.current) {
                        originalQueueRef.current = [...originalQueueRef.current, ...recommended];
                    }
                    loadAndPlay(recommended[0], undefined, idx + 1);
                } else {
                    setIsPlaying(false);
                } 
            } catch {
                setIsPlaying(false);
            }
        } else {
            setIsPlaying(false);
        }
    };

    const playNext = () => {
        handleNext();
    }

    const playPrev = () => {
        if (currentIndex === null || queue.length === 0) return;
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
        loadAndPlay(queue[prevIdx], undefined, prevIdx);
    };

    const toggleShuffle = () => {
        const q = queueRef.current;
        const idx = currentIndexRef.current;

        if (!isShuffle) {
            // BẬT shuffle: xáo queue hiện tại, giữ bài đang phát lên đầu
            setIsShuffle(true);
            if (q.length > 1 && idx !== null) {
                originalQueueRef.current = q;                       // lưu thứ tự gốc
                const current = q[idx];
                const rest = shuffleArray(q.filter((_, i) => i !== idx));
                setQueue([current, ...rest]);
                setCurrentIndex(0);
            }
            return;
        }

        // TẮT shuffle: khôi phục thứ tự gốc, giữ nguyên bài đang phát
        setIsShuffle(false);
        const original = originalQueueRef.current;
        originalQueueRef.current = null;
        if (original && idx !== null) {
            const current = q[idx];
            const restoreIdx = current ? original.findIndex(s => s.id === current.id) : -1;
            setQueue(original);
            setCurrentIndex(restoreIdx === -1 ? 0 : restoreIdx);
        }
    };
    const toggleRepeat = () => setRepeatMode(prev =>
        prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
    );



    audioRef.current.onended = handleNext;

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
