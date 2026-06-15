require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const rootRoute = require("./src/routes/index");
const musicRoomSocket = require("./src/socket/musicRoomSocket");

const app = express();

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"];

connectDB();

// Middlewares
app.use(cors({
  origin: ALLOWED_ORIGINS
}));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api", rootRoute);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Lỗi hệ thống nội bộ",
  });
});

const PORT = process.env.PORT || 3000;

// Bọc Express bằng HTTP server để Socket.io gắn vào cùng cổng
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS },
});
musicRoomSocket.setup(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
