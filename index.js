require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");
const rootRoute = require("./src/routes/index");
const morgan = require("morgan");

const app = express();

connectDB();

// BẮT BUỘC CÓ: Giúp Express đọc được dữ liệu JSON gửi lên
app.use(express.json());

// Cắm toàn bộ hệ thống API vào đường dẫn '/api'
app.use("/api", rootRoute);

app.use(morgan("combined"));

app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Done");
});
