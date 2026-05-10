const express = require("express");
const router = express.Router();
const claimController = require("../app/controllers/claimController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

// Bất kỳ user đã đăng nhập đều có thể gửi khiếu nại
router.post("/", verifyToken, claimController.createClaim);

// User xem khiếu nại của chính mình
router.get("/my", verifyToken, claimController.getMyClaims);

// Admin: xem tất cả khiếu nại (có thể ?status=pending|approved|rejected)
router.get("/", verifyToken, verifyAdmin, claimController.getClaims);

// Admin: duyệt hoặc từ chối
router.patch("/:id/resolve", verifyToken, verifyAdmin, claimController.resolveClaim);

module.exports = router;
