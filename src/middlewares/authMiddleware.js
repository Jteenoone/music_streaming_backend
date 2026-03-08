const jwt = require("jsonwebtoken");

// Lớp 1: Kiểm tra xem user có mang theo Token (đã đăng nhập) không
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token)
    return res
      .status(401)
      .json({ message: "Từ chối truy cập. Bạn chưa đăng nhập!" });

  try {
    const tokenString = token.startsWith("Bearer ")
      ? token.slice(7, token.length)
      : token;
    const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// Lớp 2: Kiểm tra xem user có phải là Admin không
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res
        .status(403)
        .json({ message: "Từ chối truy cập. Bạn không có quyền Admin!" });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };
