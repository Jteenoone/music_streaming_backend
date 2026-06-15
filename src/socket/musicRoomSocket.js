// ─────────────────────────────────────────────────────────────────────────────
// Music Room — nghe nhạc realtime cùng nhau qua WebSocket (Socket.io)
// Trạng thái mỗi phòng lưu trong bộ nhớ (Map), không cần MongoDB cho phần realtime.
// ─────────────────────────────────────────────────────────────────────────────

const rooms = new Map(); // roomId -> { hostId, members: Map<socketId,{name}>, song, isPlaying, position, updatedAt }

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
  };
}

function memberList(room) {
  return [...room.members.entries()].map(([id, m]) => ({
    id,
    name: m.name,
    isHost: id === room.hostId,
  }));
}

function setup(io) {
  io.on("connection", (socket) => {
    let currentRoomId = null;

    // ── Tạo phòng ──────────────────────────────────────────────────────────
    socket.on("room:create", ({ name } = {}, cb) => {
      const roomId = genRoomId();
      const room = {
        hostId: socket.id,
        members: new Map([[socket.id, { name: name || "Khách" }]]),
        song: null,
        isPlaying: false,
        position: 0,
        updatedAt: Date.now(),
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      currentRoomId = roomId;
      cb?.({ ok: true, roomId, isHost: true, ...roomSnapshot(room), members: memberList(room) });
    });

    // ── Vào phòng ──────────────────────────────────────────────────────────
    socket.on("room:join", ({ roomId, name } = {}, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Phòng không tồn tại" });

      room.members.set(socket.id, { name: name || "Khách" });
      socket.join(roomId);
      currentRoomId = roomId;

      cb?.({
        ok: true,
        roomId,
        isHost: socket.id === room.hostId,
        ...roomSnapshot(room),
        members: memberList(room),
      });
      // Báo cả phòng cập nhật danh sách thành viên
      io.to(roomId).emit("room:members", memberList(room));
      socket.to(roomId).emit("room:system", `${name || "Một người"} đã tham gia phòng`);
    });

    // ── Host điều khiển: đổi bài / play / pause / seek ───────────────────────
    const requireHost = () => {
      const room = rooms.get(currentRoomId);
      if (!room || room.hostId !== socket.id) return null;
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

    // ── Chat trong phòng ─────────────────────────────────────────────────────
    socket.on("chat:message", ({ text } = {}) => {
      const room = rooms.get(currentRoomId);
      if (!room || !text) return;
      const member = room.members.get(socket.id);
      io.to(currentRoomId).emit("chat:message", {
        name: member?.name || "Khách",
        text: String(text).slice(0, 500),
        at: Date.now(),
      });
    });

    // ── Rời phòng / ngắt kết nối ─────────────────────────────────────────────
    const leaveRoom = () => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const member = room.members.get(socket.id);
      room.members.delete(socket.id);
      socket.leave(currentRoomId);

      if (room.members.size === 0) {
        rooms.delete(currentRoomId); // phòng trống thì xóa
      } else {
        // Nếu host rời đi, chuyển quyền cho người đầu tiên còn lại
        if (room.hostId === socket.id) {
          room.hostId = room.members.keys().next().value;
          io.to(currentRoomId).emit("room:host", room.hostId);
        }
        io.to(currentRoomId).emit("room:members", memberList(room));
        io.to(currentRoomId).emit("room:system", `${member?.name || "Một người"} đã rời phòng`);
      }
      currentRoomId = null;
    };

    socket.on("room:leave", leaveRoom);
    socket.on("disconnect", leaveRoom);
  });
}

module.exports = { setup };
