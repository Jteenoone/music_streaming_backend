const CopyrightClaim = require("../models/copyrightClaimModel");
const Song = require("../models/songModel");

const createClaimService = async ({ claimantId, songId, isrc, iswc, description }) => {
  const song = await Song.findById(songId);
  if (!song) {
    return { success: false, status: 404, message: "Không tìm thấy bài hát" };
  }

  // Không cho phép khiếu nại trùng từ cùng một người đang pending
  const existing = await CopyrightClaim.findOne({
    claimant: claimantId,
    song: songId,
    status: "pending",
  });
  if (existing) {
    return { success: false, status: 409, message: "Bạn đã có khiếu nại đang chờ xử lý cho bài hát này" };
  }

  const claim = await CopyrightClaim.create({
    claimant: claimantId,
    song: songId,
    isrc: isrc || "",
    iswc: iswc || "",
    description,
  });

  return { success: true, data: claim };
};

const getClaimsService = async ({ status, page = 1, limit = 20 }) => {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [claims, total] = await Promise.all([
    CopyrightClaim.find(filter)
      .populate("claimant", "username email")
      .populate("song", "title artist isrc iswc")
      .populate("resolvedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CopyrightClaim.countDocuments(filter),
  ]);

  return {
    success: true,
    data: {
      claims,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total, limit },
    },
  };
};

const getMyClaimsService = async (claimantId) => {
  const claims = await CopyrightClaim.find({ claimant: claimantId })
    .populate("song", "title artist coverImage isrc iswc")
    .sort({ createdAt: -1 });
  return { success: true, data: claims };
};

// Admin duyệt hoặc từ chối khiếu nại
const resolveClaimService = async ({ claimId, adminId, action, adminNote }) => {
  if (!["approved", "rejected"].includes(action)) {
    return { success: false, status: 400, message: "action phải là 'approved' hoặc 'rejected'" };
  }

  const claim = await CopyrightClaim.findById(claimId);
  if (!claim) return { success: false, status: 404, message: "Không tìm thấy khiếu nại" };
  if (claim.status !== "pending") {
    return { success: false, status: 400, message: "Khiếu nại này đã được xử lý rồi" };
  }

  claim.status = action;
  claim.adminNote = adminNote || "";
  claim.resolvedBy = adminId;
  claim.resolvedAt = new Date();
  await claim.save();

  // Nếu duyệt → đặt bài hát thành "disputed" (ẩn khỏi người dùng thường)
  if (action === "approved") {
    await Song.findByIdAndUpdate(claim.song, {
      "copyright.status": "disputed",
    });
  }

  return { success: true, data: claim };
};

module.exports = {
  createClaimService,
  getClaimsService,
  getMyClaimsService,
  resolveClaimService,
};
