import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { songAPI, userAPI, normalizeSong } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaPlay, FaPause, FaUserAlt, FaCrown, FaSignOutAlt, FaCopy, FaPaperPlane, FaStepForward, FaPlus, FaTrash } from "react-icons/fa";
import { MdMusicNote } from "react-icons/md";

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function MusicRoomPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();

  const [phase, setPhase] = useState("lobby"); // 'lobby' | 'room'
  const [name, setName] = useState(user?.username || "Khách");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  //  cho người dùng tự chọn có tính nhạc
  // nghe trong phòng vào lịch sử & gợi ý cá nhân của mình hay không
  const [countToHistory, setCountToHistory] = useState(true);

  // Chat, tìm bài & hàng chờ chung
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [search, setSearch] = useState("");
  const [songResults, setSongResults] = useState([]);
  const [queue, setQueue] = useState([]);
  const chatEndRef = useRef(null);

  // Refs để handler 'ended' đọc được giá trị mới nhất (tránh closure cũ)
  const isHostRef = useRef(isHost);
  const queueRef = useRef(queue);
  isHostRef.current = isHost;
  queueRef.current = queue;

  // Refs để handler 'sync:song' (đăng ký 1 lần) luôn đọc được giá trị mới nhất
  const countToHistoryRef = useRef(countToHistory);
  const userRef = useRef(user);
  countToHistoryRef.current = countToHistory;
  userRef.current = user;

  // ── Tính 1 lượt nghe cho CHÍNH người dùng (giống nghe nhạc thường) ──────────
  // Chỉ ghi khi đã đăng nhập và bật công tắc "tính vào lịch sử".
  const recordListen = (song) => {
    if (!song?.id || !userRef.current || !countToHistoryRef.current) return;
    songAPI.play(song.id).catch(() => {});        // tăng playCount công khai của bài
    userAPI.recordPlay(song.id).catch(() => {});  // recentlyPlayed + ListeningHistory (gợi ý)
  };

  // ── Nạp 1 bài hát vào audio và tua tới vị trí cho trước ────────────────────
  const loadSong = (song, position = 0, play = true) => {
    const audio = audioRef.current;
    if (!song?.url) return;
    audio.src = song.url;
    audio.load();
    const onCanPlay = () => {
      audio.currentTime = position || 0;
      if (play) audio.play().catch(() => setNeedsInteraction(true));
    };
    audio.addEventListener("canplay", onCanPlay, { once: true });
  };

  // ── Kết nối socket + đăng ký sự kiện đồng bộ (chạy 1 lần) ───────────────────
  useEffect(() => {
    if (!user) return; // khách chưa đăng nhập không kết nối phòng
    socket.connect();

    socket.on("room:members", setMembers);
    socket.on("room:host", (hostId) => setIsHost(hostId === user.id));
    socket.on("room:system", (text) =>
      setMessages((m) => [...m, { system: true, text, at: Date.now() }])
    );
    socket.on("chat:message", (msg) => setMessages((m) => [...m, msg]));
    socket.on("queue:update", setQueue);

    socket.on("sync:song", ({ song, position, isPlaying }) => {
      setCurrentSong(song);
      setIsPlaying(isPlaying);
      loadSong(song, position, isPlaying);
      recordListen(song); // tính lượt nghe vào lịch sử của mình (nếu đã bật)
    });
    socket.on("sync:play", ({ position }) => {
      audioRef.current.currentTime = position;
      audioRef.current.play().catch(() => setNeedsInteraction(true));
      setIsPlaying(true);
    });
    socket.on("sync:pause", ({ position }) => {
      audioRef.current.currentTime = position;
      audioRef.current.pause();
      setIsPlaying(false);
    });
    socket.on("sync:seek", ({ position }) => {
      audioRef.current.currentTime = position;
    });

    // Tự vào lại phòng đã lưu sau khi reload trang (server giữ chỗ trong ~20s)
    const savedRoom = localStorage.getItem("musicRoomId");
    if (savedRoom) {
      socket.emit("room:join", { roomId: savedRoom, name: user.username || "Khách" }, (res) => {
        if (res?.ok) applySnapshot(res);
        else localStorage.removeItem("musicRoomId");
      });
    }

    return () => {
      // KHÔNG emit room:leave ở đây: để khi reload/rời trang server dùng grace period.
      // Rời phòng dứt khoát chỉ qua nút "Rời phòng".
      socket.off();
      socket.disconnect();
      audioRef.current.pause();
    };
  }, [user]);

  // ── Cập nhật thanh thời gian ───────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    // Hết bài: chỉ host mới điều khiển — phát bài kế tiếp trong hàng chờ
    const onEnded = () => {
      if (isHostRef.current && queueRef.current.length > 0) socket.emit("host:next");
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Tạo / vào phòng ────────────────────────────────────────────────────────
  const applySnapshot = (res) => {
    localStorage.setItem("musicRoomId", res.roomId); // nhớ phòng để tự vào lại sau reload
    setRoomId(res.roomId);
    setIsHost(res.isHost);
    setMembers(res.members || []);
    setQueue(res.queue || []);
    setPhase("room");
    if (res.song) {
      setCurrentSong(res.song);
      setIsPlaying(res.isPlaying);
      loadSong(res.song, res.position, res.isPlaying);
      recordListen(res.song); // vào phòng đang phát dở cũng tính là đang nghe bài này
    }
  };

  const createRoom = () => {
    setError("");
    socket.emit("room:create", { name }, (res) => {
      if (res?.ok) applySnapshot(res);
      else setError(res?.error || "Không tạo được phòng");
    });
  };

  const joinRoom = () => {
    setError("");
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError("Nhập mã phòng");
    socket.emit("room:join", { roomId: code, name }, (res) => {
      if (res?.ok) applySnapshot(res);
      else setError(res?.error || "Không vào được phòng");
    });
  };

  const leaveRoom = () => {
    localStorage.removeItem("musicRoomId"); // rời dứt khoát → không tự vào lại nữa
    socket.emit("room:leave");
    audioRef.current.pause();
    setPhase("lobby");
    setRoomId(null);
    setCurrentSong(null);
    setIsPlaying(false);
    setMembers([]);
    setMessages([]);
    setQueue([]);
  };

  // ── Hàng chờ chung — mọi người đều thêm/xóa được ───────────────────────────
  const addToQueue = (song) => socket.emit("queue:add", { song });
  const removeFromQueue = (uid) => socket.emit("queue:remove", { uid });
  const playNext = () => { if (isHost) socket.emit("host:next"); };
  const playFromQueue = (uid) => { if (isHost) socket.emit("host:playFromQueue", { uid }); };

  // ── Host điều khiển ────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await songAPI.search(search.trim());
      setSongResults((res.data.data ?? []).map(normalizeSong).filter(Boolean));
    } catch {
      setSongResults([]);
    }
  };

  const pickSong = (song) => {
    if (!isHost) return;
    setCurrentSong(song);
    setIsPlaying(true);
    setNeedsInteraction(false);
    loadSong(song, 0, true);
    socket.emit("host:song", { song });
    recordListen(song); // host phát ngay không nhận lại sync:song nên ghi tại đây
  };

  const togglePlay = () => {
    if (!isHost || !currentSong) return;
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(() => setNeedsInteraction(true));
      setIsPlaying(true);
      socket.emit("host:play", { position: audio.currentTime });
    } else {
      audio.pause();
      setIsPlaying(false);
      socket.emit("host:pause", { position: audio.currentTime });
    }
  };

  const handleSeek = (e) => {
    if (!isHost) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    socket.emit("host:seek", { position: time });
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit("chat:message", { text: chatInput.trim() });
    setChatInput("");
  };

  const resumeAudio = () => {
    audioRef.current.play().then(() => setNeedsInteraction(false)).catch(() => {});
  };

  const copyCode = () => navigator.clipboard?.writeText(roomId);

  // ── Khách chưa đăng nhập — bắt buộc đăng nhập mới vào được phòng ────────────
  if (!user) {
    return (
      <div className="max-w-[480px] mx-auto mt-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <MdMusicNote size={32} className="text-[#7c83f5]" />
          <h1 className="text-2xl font-bold m-0">Phòng nghe chung</h1>
        </div>
        <p className="text-sm text-[#9ca3af] mb-6">
          Nghe nhạc đồng bộ realtime cùng bạn bè — chủ phòng phát, mọi người nghe cùng lúc.
        </p>

        <div className="bg-[#2d6be4] rounded-2xl p-6">
          <p className="text-lg font-bold text-white m-0 mb-1.5">Đăng nhập để vào phòng nghe chung</p>
          <p className="text-sm text-white/80 m-0 mb-5">
            Bạn cần đăng nhập để tạo phòng, vào phòng và nghe nhạc cùng bạn bè.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-white font-semibold bg-transparent border-none cursor-pointer hover:underline px-2"
            >
              Để sau
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-bold bg-white text-[#1a1f35] px-5 py-2 rounded-full border-none cursor-pointer hover:scale-105 transition-transform"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="max-w-[480px] mx-auto mt-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <MdMusicNote size={32} className="text-[#7c83f5]" />
          <h1 className="text-2xl font-bold m-0">Phòng nghe chung</h1>
        </div>
        <p className="text-sm text-[#9ca3af] mb-6">
          Nghe nhạc đồng bộ realtime cùng bạn bè — chủ phòng phát, mọi người nghe cùng lúc.
        </p>

        <label className="text-xs text-[#9ca3af]">Tên hiển thị</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 mt-1 mb-5 bg-[#1a1f35] text-white rounded-lg border border-[#2e3450] outline-none focus:border-[#7c83f5]"
        />

        <button
          onClick={createRoom}
          className="w-full h-11 bg-[#7c83f5] text-white font-semibold rounded-lg border-none cursor-pointer hover:bg-[#6670e8] transition-colors mb-4"
        >
          + Tạo phòng mới
        </button>

        <div className="flex items-center gap-3 my-4 text-[#6b7280] text-xs">
          <div className="flex-1 h-px bg-[#2e3450]" /> HOẶC <div className="flex-1 h-px bg-[#2e3450]" />
        </div>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã phòng (VD: ABC123)"
            className="flex-1 h-11 px-3 bg-[#1a1f35] text-white rounded-lg border border-[#2e3450] outline-none focus:border-[#7c83f5] uppercase tracking-widest"
          />
          <button
            onClick={joinRoom}
            className="h-11 px-5 bg-[#2e3450] text-white font-semibold rounded-lg border-none cursor-pointer hover:bg-[#3a4060] transition-colors"
          >
            Vào
          </button>
        </div>
        {error && <p className="text-[#f87171] text-sm mt-3">{error}</p>}
      </div>
    );
  }

  // ── Trong phòng ──────────────────────────────────────────────────────────────
  return (
    <div className="text-white max-w-[1100px] mx-auto">
      {/* Header phòng */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#9ca3af]">Mã phòng:</span>
          <code className="text-lg font-bold tracking-[0.3em] bg-[#1a1f35] px-3 py-1 rounded-lg">{roomId}</code>
          <button onClick={copyCode} title="Sao chép mã" className="text-[#9ca3af] hover:text-white bg-transparent border-none cursor-pointer">
            <FaCopy size={15} />
          </button>
          <span className={`text-xs px-2 py-1 rounded-full ${isHost ? "bg-[#7c83f5]/20 text-[#7c83f5]" : "bg-[#2e3450] text-[#9ca3af]"}`}>
            {isHost ? "Bạn là chủ phòng" : "Đang nghe theo chủ phòng"}
          </span>
        </div>
        <button
          onClick={leaveRoom}
          className="flex items-center gap-2 px-4 py-2 bg-[#2e3450] text-[#f87171] rounded-lg border-none cursor-pointer hover:bg-[#3a4060] transition-colors text-sm"
        >
          <FaSignOutAlt size={13} /> Rời phòng
        </button>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 300px" }}>
        {/* Cột trái: trình phát + chọn bài */}
        <div>
          {/* Now playing */}
          <div className="bg-[#1a1f35] rounded-2xl p-6 mb-5">
            {currentSong ? (
              <div className="flex items-center gap-5">
                <img src={currentSong.src_img} alt="" className="w-28 h-28 rounded-xl object-cover shrink-0 bg-[#2e3450]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold m-0 truncate">{currentSong.name}</p>
                  <p className="text-sm text-[#9ca3af] m-0 mb-4 truncate">{currentSong.singer}</p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      disabled={!isHost}
                      className="bg-white rounded-full w-11 h-11 flex items-center justify-center border-none cursor-pointer hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isPlaying ? <FaPause size={18} color="#1a1f35" /> : <FaPlay size={18} color="#1a1f35" />}
                    </button>
                    {isHost && (
                      <button
                        onClick={playNext}
                        disabled={queue.length === 0}
                        title="Phát bài tiếp theo trong hàng chờ"
                        className="bg-transparent border-none cursor-pointer text-white p-1 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FaStepForward size={16} />
                      </button>
                    )}
                    <span className="text-xs text-[#9ca3af] min-w-[36px]">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      disabled={!isHost}
                      className="flex-1 disabled:opacity-60"
                    />
                    <span className="text-xs text-[#9ca3af] min-w-[36px]">{formatTime(duration)}</span>
                  </div>

                  {needsInteraction && (
                    <button onClick={resumeAudio} className="mt-3 text-xs bg-[#7c83f5] text-white px-3 py-1.5 rounded-lg border-none cursor-pointer">
                      🔊 Bấm để bật tiếng & đồng bộ
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#6b7280]">
                <MdMusicNote size={40} className="mx-auto mb-2" />
                <p className="m-0 text-sm">
                  {isHost ? "Tìm và chọn một bài hát để bắt đầu" : "Chờ chủ phòng chọn bài hát..."}
                </p>
              </div>
            )}
          </div>

          {/* Tìm bài — ai cũng thêm vào hàng chờ được; host có thể phát ngay */}
          <div className="bg-[#1a1f35] rounded-2xl p-5 mb-5">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bài hát để thêm vào hàng chờ..."
                className="flex-1 h-10 px-3 bg-[#2e3450] text-white rounded-lg border-none outline-none"
              />
              <button type="submit" className="px-4 bg-[#7c83f5] text-white rounded-lg border-none cursor-pointer hover:bg-[#6670e8]">
                Tìm
              </button>
            </form>
            <div className="max-h-[240px] overflow-y-auto">
              {songResults.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group">
                  <img src={s.src_img} alt="" className="w-10 h-10 rounded object-cover bg-[#2e3450]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm m-0 truncate">{s.name}</p>
                    <p className="text-xs text-[#9ca3af] m-0 truncate">{s.singer}</p>
                  </div>
                  <button
                    onClick={() => addToQueue(s)}
                    title="Thêm vào hàng chờ"
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#2e3450] text-white rounded-lg border-none cursor-pointer hover:bg-[#3a4060] shrink-0"
                  >
                    <FaPlus size={10} /> Hàng chờ
                  </button>
                  {isHost && (
                    <button
                      onClick={() => pickSong(s)}
                      title="Phát ngay cho cả phòng"
                      className="text-xs px-2.5 py-1.5 bg-[#7c83f5] text-white rounded-lg border-none cursor-pointer hover:bg-[#6670e8] shrink-0"
                    >
                      Phát ngay
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hàng chờ chung */}
          <div className="bg-[#1a1f35] rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-[#6b7280] m-0 mb-3">
              Hàng chờ chung ({queue.length})
            </p>
            {queue.length === 0 ? (
              <p className="text-sm text-[#6b7280] m-0">Chưa có bài nào — tìm và thêm bài để cả phòng cùng nghe.</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
                {queue.map((item, i) => (
                  <div key={item.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group">
                    <span className="text-xs text-[#6b7280] w-5 text-center shrink-0">{i + 1}</span>
                    <img src={item.song.src_img} alt="" className="w-9 h-9 rounded object-cover bg-[#2e3450]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm m-0 truncate">{item.song.name}</p>
                      <p className="text-xs text-[#9ca3af] m-0 truncate">
                        {item.song.singer} · <span className="text-[#6b7280]">thêm bởi {item.addedBy}</span>
                      </p>
                    </div>
                    {isHost && (
                      <button
                        onClick={() => playFromQueue(item.uid)}
                        title="Phát bài này ngay"
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white rounded-full border-none cursor-pointer shrink-0 transition-opacity hover:scale-105"
                      >
                        <FaPlay size={11} color="#1a1f35" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFromQueue(item.uid)}
                      title="Xóa khỏi hàng chờ"
                      className="opacity-0 group-hover:opacity-100 text-[#6b7280] hover:text-[#f87171] bg-transparent border-none cursor-pointer shrink-0 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: thành viên + chat */}
        <div className="flex flex-col gap-4">
          {/* Thành viên */}
          <div className="bg-[#1a1f35] rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-[#6b7280] m-0 mb-3">
              Đang nghe ({members.length})
            </p>
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2e3450] flex items-center justify-center shrink-0">
                    <FaUserAlt size={12} color="#9ca3af" />
                  </div>
                  <span className="text-sm truncate flex-1">
                    {m.name}
                    {m.id === user.id && <span className="text-[#6b7280]"> (bạn)</span>}
                  </span>
                  {m.isHost && <FaCrown size={13} color="#fbbf24" title="Chủ phòng" />}
                </div>
              ))}
            </div>

            {/* Công tắc riêng tư kiểu Spotify Private Session */}
            {user && (
              <label className="flex items-start gap-2 mt-4 pt-3 border-t border-[#2e3450] cursor-pointer">
                <input
                  type="checkbox"
                  checked={countToHistory}
                  onChange={(e) => setCountToHistory(e.target.checked)}
                  className="mt-0.5 accent-[#7c83f5] cursor-pointer shrink-0"
                />
                <span className="text-xs text-[#9ca3af] leading-snug">
                  Tính nhạc nghe trong phòng vào lịch sử & gợi ý của tôi
                </span>
              </label>
            )}
          </div>

          {/* Chat */}
          <div className="bg-[#1a1f35] rounded-2xl p-4 flex flex-col" style={{ height: 320 }}>
            <p className="text-xs uppercase tracking-wider text-[#6b7280] m-0 mb-2">Trò chuyện</p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-2">
              {messages.map((m, i) =>
                m.system ? (
                  <p key={i} className="text-[11px] text-center text-[#6b7280] m-0">— {m.text} —</p>
                ) : (
                  <div key={i} className="text-sm">
                    <span className="text-[#7c83f5] font-semibold">{m.name}: </span>
                    <span className="text-[#e5e7eb]">{m.text}</span>
                  </div>
                )
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin..."
                className="flex-1 h-9 px-3 bg-[#2e3450] text-white rounded-lg border-none outline-none text-sm"
              />
              <button type="submit" className="px-3 bg-[#7c83f5] text-white rounded-lg border-none cursor-pointer hover:bg-[#6670e8]">
                <FaPaperPlane size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
