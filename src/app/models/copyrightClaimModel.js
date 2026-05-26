const mongoose = require("mongoose");

const copyrightClaimSchema = new mongoose.Schema(
  {
    // Tài khoản người khiếu nại — null nếu gửi không cần đăng nhập
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Thông tin liên hệ — bắt buộc (dùng để gửi email phản hồi)
    claimantName:  { type: String, required: true, trim: true },
    claimantEmail: { type: String, required: true, trim: true, lowercase: true },
    claimantOrg:   { type: String, default: "", trim: true },
    // Tuyên bố good faith theo chuẩn DMCA
    goodFaith: { type: Boolean, required: true },
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    isrc: { type: String, default: "", trim: true, uppercase: true },
    iswc: { type: String, default: "", trim: true, uppercase: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote:  { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CopyrightClaim", copyrightClaimSchema);
