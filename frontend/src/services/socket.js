import { io } from "socket.io-client";

// Backend Socket.io chạy cùng cổng với REST API (mặc định localhost:3000).
// Proxy của Vite chỉ xử lý /api nên socket phải nối thẳng tới backend.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Kết nối thủ công (autoConnect: false) để chỉ mở khi vào trang Music Room.
// auth là hàm → đọc lại token mới nhất ở mỗi lần (re)connect (vd sau khi reload).
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});
