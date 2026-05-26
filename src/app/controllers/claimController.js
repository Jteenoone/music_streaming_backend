const claimService = require("../services/claimService");

const createClaim = async (req, res) => {
  try {
    const { songId, isrc, iswc, description, claimantName, claimantEmail, claimantOrg, goodFaith } = req.body;
    if (!songId || !description) {
      return res.status(400).json({ message: "Vui long cung cap songId va mo ta khieu nai" });
    }
    const result = await claimService.createClaimService({
      claimantId:    req.user?.id || null,
      claimantName,
      claimantEmail,
      claimantOrg,
      songId,
      isrc,
      iswc,
      description,
      goodFaith,
    });
    if (!result.success) return res.status(result.status).json({ message: result.message });
    res.status(201).json({
      message: "Da gui khieu nai ban quyen thanh cong. Email xac nhan da duoc gui.",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong", error: error.message });
  }
};

const getClaims = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await claimService.getClaimsService({
      status,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
    });
    res.status(200).json({ message: "Danh sach khieu nai", ...result.data });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong", error: error.message });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const result = await claimService.getMyClaimsService(req.user.id);
    res.status(200).json({ message: "Khieu nai cua ban", data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong", error: error.message });
  }
};

const resolveClaim = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const result = await claimService.resolveClaimService({
      claimId:  req.params.id,
      adminId:  req.user.id,
      action,
      adminNote,
    });
    if (!result.success) return res.status(result.status).json({ message: result.message });
    const msg = action === "approved"
      ? "Da duyet khieu nai - bai hat da bi an"
      : "Da tu choi khieu nai";
    res.status(200).json({ message: msg, data: result.data });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong", error: error.message });
  }
};

module.exports = { createClaim, getClaims, getMyClaims, resolveClaim };
