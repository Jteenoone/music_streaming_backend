const jwt = require("jsonwebtoken");

/**
 * Middleware: Xác thực Token người dùng
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Lấy token từ định dạng "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Truy cập bị từ chối. Bạn chưa đăng nhập!",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    let message = "Token không hợp lệ!";
    if (error.name === "TokenExpiredError") {
      message = "Token đã hết hạn!";
    }
    return res.status(403).json({
      success: false,
      message: message,
    });
  }
};

/**
 * Middleware: Kiểm tra quyền Admin
 * Phải dùng sau verifyToken
 */
const verifyAdmin = (req, res, next) => {
  // Chain verifyToken first if not already verified
  if (!req.user) {
    return verifyToken(req, res, () => {
      if (req.user && req.user.role === "admin") {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Từ chối truy cập. Bạn không có quyền Admin!",
        });
      }
    });
  }
  if (req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Từ chối truy cập. Bạn không có quyền Admin!",
    });
  }
};

/**
 * Middleware: Kiểm tra quyền Artist hoặc Admin
 * Phải dùng sau verifyToken
 */
const verifyArtist = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Truy cập bị từ chối. Bạn chưa đăng nhập!" });
  }
  if (req.user.role === "artist" || req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Từ chối truy cập. Chỉ nghệ sỹ hoặc Admin mới có quyền này!" });
};

/**
 * Middleware: Đọc token nếu có, không bắt buộc — dùng cho route public nhưng cần phân biệt admin
 */
const optionalToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {}
  next();
};

module.exports = { verifyToken, verifyAdmin, verifyArtist, optionalToken };
