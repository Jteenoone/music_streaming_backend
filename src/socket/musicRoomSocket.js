// ─────────────────────────────────────────────────────────────────────────────
// Music Room — nghe nhạc realtime cùng nhau qua WebSocket (Socket.io)
// Trạng thái mỗi phòng lưu trong bộ nhớ (Map), không cần MongoDB cho phần realtime.
//
// Thành viên được định danh theo userId (JWT), KHÔNG theo socket.id — vì socket.id
// đổi mỗi lần reload. Nhờ đó hỗ trợ "grace period": reload trang không bị mất phòng.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

const rooms = new Map(); // roomId -> { hostId(userId), members: Map<userId,{name,socketId}>, song, isPlaying, position, updatedAt, queue }

// Hẹn giờ xóa thành viên sau khi mất kết nối (cho phép quay lại trong GRACE_MS)
const leaveTimers = new Map(); // `${roomId}:${userId}` -> Timeout
const GRACE_MS = 20000;        // 20 giây
const timerKey = (roomId, userId) => `${roomId}:${userId}`;

// Sinh mã phòng 6 ký tự (chữ in hoa + số), không trùng phòng đang mở
function genRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id;
  do {
    id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(id));
  return id;
}

// Vị trí phát hiện tại = vị trí đã lưu + thời gian trôi qua nếu đang phát
function effectivePosition(room) {
  if (!room.isPlaying) return room.position;
  return room.position + (Date.now() - room.updatedAt) / 1000;
}

// Tóm tắt phòng để gửi cho client khi vào / đồng bộ
function roomSnapshot(room) {
  return {
    song: room.song,
    isPlaying: room.isPlaying,
    position: effectivePosition(room),
    hostId: room.hostId,
    queue: room.queue,
  };
}

function memberList(room) {
  return [...room.members.entries()].map(([userId, m]) => ({
    id: userId,
    name: m.name,
    isHost: userId === room.hostId,
  }));
}

function setup(io) {
  // ── Xác thực JWT khi kết nối: chỉ user đã đăng nhập mới vào được phòng ──────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("UNAUTHENTICATED"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;

    // ── Helper: hẹn giờ / hủy hẹn giờ xóa thành viên ─────────────────────────
    const clearLeaveTimer = (roomId, userId) => {
      const k = timerKey(roomId, userId);
      if (leaveTimers.has(k)) {
        clearTimeout(leaveTimers.get(k));
        leaveTimers.delete(k);
      }
    };

    const scheduleLeave = (roomId, userId) => {
      clearLeaveTimer(roomId, userId);
      const t = setTimeout(() => {
        leaveTimers.delete(timerKey(roomId, userId));
        removeMember(roomId, userId);
      }, GRACE_MS);
      leaveTimers.set(timerKey(roomId, userId), t);
    };

    // ── Xóa thành viên thật sự (sau grace, hoặc khi bấm rời phòng) ────────────
    const removeMember = (roomId, userId) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const member = room.members.get(userId);
      if (!member) return;
      room.members.delete(userId);

      if (room.members.size === 0) {
        rooms.delete(roomId); // phòng trống thì xóa
        return;
      }
      // Nếu host rời đi, chuyển quyền cho người đầu tiên còn lại
      if (room.hostId === userId) {
        room.hostId = room.members.keys().next().value;
        io.to(roomId).emit("room:host", room.hostId);
      }
      io.to(roomId).emit("room:members", memberList(room));
      io.to(roomId).emit("room:system", `${member.name || "Một người"} đã rời phòng`);
    };

    // ── Tạo phòng ──────────────────────────────────────────────────────────
    socket.on("room:create", ({ name } = {}, cb) => {
      const roomId = genRoomId();
      const room = {
        hostId: socket.userId,
        members: new Map([[socket.userId, { name: name || "Khách", socketId: socket.id }]]),
        song: null,
        isPlaying: false,
        position: 0,
        updatedAt: Date.now(),
        queue: [], // hàng chờ chung: [{ uid, song, addedBy }]
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      currentRoomId = roomId;
      cb?.({ ok: true, roomId, isHost: true, ...roomSnapshot(room), members: memberList(room) });
    });

    // ── Vào phòng (cũng dùng để quay lại sau khi reload) ─────────────────────
    socket.on("room:join", ({ roomId, name } = {}, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Phòng không tồn tại" });

      const rejoining = room.members.has(socket.userId); // đã là thành viên → đây là quay lại sau reload
      clearLeaveTimer(roomId, socket.userId);            // hủy hẹn xóa nếu có

      room.members.set(socket.userId, { name: name || "Khách", socketId: socket.id });
      socket.join(roomId);
      currentRoomId = roomId;

      cb?.({
        ok: true,
        roomId,
        isHost: socket.userId === room.hostId,
        ...roomSnapshot(room),
        members: memberList(room),
      });
      io.to(roomId).emit("room:members", memberList(room));
      // Chỉ báo "đã tham gia" với người vào MỚI, không báo khi chỉ là reload quay lại
      if (!rejoining) {
        socket.to(roomId).emit("room:system", `${name || "Một người"} đã tham gia phòng`);
      }
    });

    // ── Host điều khiển: đổi bài / play / pause / seek ───────────────────────
    const requireHost = () => {
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.userId) return null;
      return room;
    };

    socket.on("host:song", ({ song } = {}) => {
      const room = requireHost();
      if (!room) return;
      room.song = song;
      room.position = 0;
      room.isPlaying = true;
      room.updatedAt = Date.now();
      socket.to(currentRoomId).emit("sync:song", { song, position: 0, isPlaying: true });
    });

    socket.on("host:play", ({ position } = {}) => {
      const room = requireHost();
      if (!room) return;
      room.position = position ?? room.position;
      room.isPlaying = true;
      room.updatedAt = Date.now();
      socket.to(currentRoomId).emit("sync:play", { position: room.position });
    });

    socket.on("host:pause", ({ position } = {}) => {
      const room = requireHost();
      if (!room) return;
      room.position = position ?? effectivePosition(room);
      room.isPlaying = false;
      room.updatedAt = Date.now();
      socket.to(currentRoomId).emit("sync:pause", { position: room.position });
    });

    socket.on("host:seek", ({ position } = {}) => {
      const room = requireHost();
      if (!room) return;
      room.position = position ?? 0;
      room.updatedAt = Date.now();
      socket.to(currentRoomId).emit("sync:seek", { position: room.position });
    });

    // ── Hàng chờ chung — mọi thành viên đều thêm / xóa được ──────────────────
    socket.on("queue:add", ({ song } = {}) => {
      const room = rooms.get(currentRoomId);
      if (!room || !song) return;
      const member = room.members.get(socket.userId);
      const item = {
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        song,
        addedBy: member?.name || "Khách",
      };
      room.queue.push(item);
      io.to(currentRoomId).emit("queue:update", room.queue);
      io.to(currentRoomId).emit("room:system", `${item.addedBy} đã thêm "${song.name}" vào hàng chờ`);
    });

    socket.on("queue:remove", ({ uid } = {}) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      room.queue = room.queue.filter((i) => i.uid !== uid);
      io.to(currentRoomId).emit("queue:update", room.queue);
    });

    // Host chọn phát NGAY một bài cụ thể trong hàng chờ (và lấy nó ra khỏi hàng chờ)
    socket.on("host:playFromQueue", ({ uid } = {}) => {
      const room = requireHost();
      if (!room) return;
      const item = room.queue.find((i) => i.uid === uid);
      if (!item) return;
      room.queue = room.queue.filter((i) => i.uid !== uid);
      room.song = item.song;
      room.position = 0;
      room.isPlaying = true;
      room.updatedAt = Date.now();
      io.to(currentRoomId).emit("sync:song", { song: item.song, position: 0, isPlaying: true });
      io.to(currentRoomId).emit("queue:update", room.queue);
    });

    // Host phát bài kế tiếp trong hàng chờ (bấm "tiếp" hoặc khi bài hiện tại kết thúc)
    socket.on("host:next", () => {
      const room = requireHost();
      if (!room || room.queue.length === 0) return;
      const item = room.queue.shift();
      room.song = item.song;
      room.position = 0;
      room.isPlaying = true;
      room.updatedAt = Date.now();
      // Gửi cho TOÀN phòng (kể cả host) để mọi người cùng nạp bài mới
      io.to(currentRoomId).emit("sync:song", { song: item.song, position: 0, isPlaying: true });
      io.to(currentRoomId).emit("queue:update", room.queue);
    });

    // ── Chat trong phòng ─────────────────────────────────────────────────────
    socket.on("chat:message", ({ text } = {}) => {
      const room = rooms.get(currentRoomId);
      if (!room || !text) return;
      const member = room.members.get(socket.userId);
      io.to(currentRoomId).emit("chat:message", {
        name: member?.name || "Khách",
        text: String(text).slice(0, 500),
        at: Date.now(),
      });
    });

    // ── Rời phòng chủ động (bấm nút) → xóa NGAY, không chờ grace ──────────────
    socket.on("room:leave", () => {
      if (!currentRoomId) return;
      clearLeaveTimer(currentRoomId, socket.userId);
      socket.leave(currentRoomId);
      removeMember(currentRoomId, socket.userId);
      currentRoomId = null;
    });

    // ── Mất kết nối (reload / rớt mạng) → HẸN GIỜ xóa, cho cơ hội quay lại ────
    socket.on("disconnect", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      const member = room?.members.get(socket.userId);
      // Chỉ hẹn xóa nếu socket này VẪN là socket hiện tại của user.
      // Nếu user đã reload và kết nối bằng socket mới, member.socketId đã khác
      // → không hẹn xóa (tránh xóa nhầm người vừa quay lại).
      if (member && member.socketId === socket.id) {
        scheduleLeave(currentRoomId, socket.userId);
      }
    });
  });
}

module.exports = { setup };
