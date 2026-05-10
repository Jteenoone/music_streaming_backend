const claimService = require("../services/claimService");

const createClaim = async (req, res) => {
  try {
    const { songId, isrc, iswc, description } = req.body;
    if (!songId || !description) {
      return res.status(400).json({ message: "Vui lòng cung cấp songId và mô tả khiếu nại" });
    }
    const result = await claimService.createClaimService({
      claimantId: req.user.id,
      songId,
      isrc,
      iswc,
      description,
    });
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(201).json({ message: "Đã gửi khiếu nại bản quyền thành công", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// Admin: lấy danh sách tất cả khiếu nại (có thể lọc theo status)
const getClaims = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await claimService.getClaimsService({
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.status(200).json({ message: "Danh sách khiếu nại", ...result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// User: lấy khiếu nại của chính mình
const getMyClaims = async (req, res) => {
  try {
    const result = await claimService.getMyClaimsService(req.user.id);
    res.status(200).json({ message: "Khiếu nại của bạn", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// Admin: duyệt / từ chối khiếu nại
const resolveClaim = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const result = await claimService.resolveClaimService({
      claimId: req.params.id,
      adminId: req.user.id,
      action,
      adminNote,
    });
    if (!result.success) return res.status(result.status).json({ message: result.message });
    const msg = action === "approved"
      ? "Đã duyệt khiếu nại — bài hát đã bị ẩn"
      : "Đã từ chối khiếu nại";
    res.status(200).json({ message: msg, data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

module.exports = { createClaim, getClaims, getMyClaims, resolveClaim };
