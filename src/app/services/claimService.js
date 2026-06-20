const CopyrightClaim = require("../models/copyrightClaimModel");
const Song = require("../models/songModel");
const { sendEmail } = require("../utils/sendEmail");

const ISRC_REGEX  = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;
const ISWC_REGEX  = /^T-\d{9}-\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCodes = (isrc, iswc) => {
  if (isrc && !ISRC_REGEX.test(isrc.replace(/-/g, "").toUpperCase()))
    return "Ma ISRC khong dung dinh dang (VD: VNAM32400001)";
  if (iswc && !ISWC_REGEX.test(iswc.toUpperCase()))
    return "Ma ISWC khong dung dinh dang (VD: T-123456789-0)";
  return null;
};

// ── Email templates ──────────────────────────────────────────────────────────

const confirmationHtml = ({ name, songTitle, claimId }) => `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
  <div style="background:#1a1f35;padding:24px 32px;border-radius:12px 12px 0 0">
    <h2 style="color:#7c83f5;margin:0 0 4px">MusicStream</h2>
    <p style="color:#9ca3af;font-size:12px;margin:0">He thong khieu nai ban quyen</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none">
    <p>Xin chao <strong>${name}</strong>,</p>
    <p>Chung toi da nhan duoc khieu nai ban quyen cua ban ve bai hat:</p>
    <div style="background:#f3f4f6;border-left:4px solid #7c83f5;padding:12px 16px;border-radius:4px;margin:16px 0">
      <strong>${songTitle}</strong>
    </div>
    <p>Ma khieu nai: <code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:13px;font-family:monospace">${claimId}</code></p>
    <p>Doi ngu cua chung toi se xem xet trong vong <strong>3-5 ngay lam viec</strong> va thong bao ket qua qua email nay.</p>
    <p style="color:#6b7280;font-size:13px;margin-top:24px">
      Neu ban khong gui khieu nai nay, vui long bo qua email nay.
    </p>
  </div>
  <div style="background:#f9fafb;padding:14px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#9ca3af">
    MusicStream &mdash; He thong khieu nai ban quyen
  </div>
</div>`;

const resolveHtml = ({ name, songTitle, action, adminNote }) => `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
  <div style="background:#1a1f35;padding:24px 32px;border-radius:12px 12px 0 0">
    <h2 style="color:#7c83f5;margin:0 0 4px">MusicStream</h2>
    <p style="color:#9ca3af;font-size:12px;margin:0">He thong khieu nai ban quyen</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none">
    <p>Xin chao <strong>${name}</strong>,</p>
    ${action === "approved" ? `
      <p>Khieu nai ban quyen cua ban ve bai hat <strong>${songTitle}</strong> da duoc
        <span style="color:#10b981;font-weight:bold">chap thuan</span>.
      </p>
      <p>Bai hat da duoc an khoi nen tang.</p>
    ` : `
      <p>Khieu nai ban quyen cua ban ve bai hat <strong>${songTitle}</strong> da bi
        <span style="color:#ef4444;font-weight:bold">tu choi</span>.
      </p>
    `}
    ${adminNote ? `
      <div style="background:#f3f4f6;border-left:4px solid #d1d5db;padding:12px 16px;border-radius:4px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280">Ghi chu tu Admin:</p>
        <p style="margin:0;font-size:14px">${adminNote}</p>
      </div>
    ` : ""}
    <p style="color:#6b7280;font-size:13px;margin-top:24px">
      Neu ban co thac mac, vui long lien he lai qua email nay.
    </p>
  </div>
  <div style="background:#f9fafb;padding:14px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#9ca3af">
    MusicStream &mdash; He thong khieu nai ban quyen
  </div>
</div>`;

// ── Services ─────────────────────────────────────────────────────────────────

const createClaimService = async ({
  claimantId, claimantName, claimantEmail, claimantOrg,
  songId, isrc, iswc, description, goodFaith,
}) => {
  if (!claimantName?.trim())
    return { success: false, status: 400, message: "Vui long cung cap ten nguoi khieu nai" };
  if (!claimantEmail?.trim() || !EMAIL_REGEX.test(claimantEmail))
    return { success: false, status: 400, message: "Dia chi email khong hop le" };
  if (!goodFaith)
    return { success: false, status: 400, message: "Ban can xac nhan tuyen bo good faith de gui khieu nai" };

  const song = await Song.findById(songId).select("title");
  if (!song) return { success: false, status: 404, message: "Khong tim thay bai hat" };

  const codeError = validateCodes(isrc, iswc);
  if (codeError) return { success: false, status: 400, message: codeError };

  // Chong trung: theo user ID neu da dang nhap, hoac theo email neu khong
  const dupFilter = claimantId
    ? { claimant: claimantId, song: songId, status: "pending" }
    : { claimantEmail: claimantEmail.toLowerCase().trim(), song: songId, status: "pending" };
  const existing = await CopyrightClaim.findOne(dupFilter);
  if (existing)
    return { success: false, status: 409, message: "Da co khieu nai dang cho xu ly cho bai hat nay tu dia chi email cua ban" };

  const claim = await CopyrightClaim.create({
    claimant:      claimantId || null,
    claimantName:  claimantName.trim(),
    claimantEmail: claimantEmail.toLowerCase().trim(),
    claimantOrg:   claimantOrg?.trim() || "",
    goodFaith:     true,
    song:          songId,
    isrc:          isrc ? isrc.replace(/-/g, "").toUpperCase() : "",
    iswc:          iswc ? iswc.toUpperCase() : "",
    description,
  });

  // Gui email xac nhan — khong block response neu loi
  sendEmail({
    email:   claim.claimantEmail,
    subject: `Xac nhan khieu nai ban quyen - ${song.title}`,
    html:    confirmationHtml({ name: claim.claimantName, songTitle: song.title, claimId: claim._id }),
  }).catch(() => {});

  return { success: true, data: claim };
};

const getClaimsService = async ({ status, page = 1, limit = 20 }) => {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [claims, total] = await Promise.all([
    CopyrightClaim.find(filter)
      .populate("claimant", "username email")
      .populate("song", "title artist isrc iswc copyright")
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

const resolveClaimService = async ({ claimId, adminId, action, adminNote }) => {
  if (!["approved", "rejected"].includes(action))
    return { success: false, status: 400, message: "action phai la 'approved' hoac 'rejected'" };

  const claim = await CopyrightClaim.findById(claimId).populate("song", "title");
  if (!claim) return { success: false, status: 404, message: "Khong tim thay khieu nai" };
  if (claim.status !== "pending")
    return { success: false, status: 400, message: "Khieu nai nay da duoc xu ly roi" };

  claim.status    = action;
  claim.adminNote = adminNote || "";
  claim.resolvedBy = adminId;
  claim.resolvedAt = new Date();
  // validateModifiedOnly: chi validate field vua sua — tranh loi voi khieu nai cu
  // thieu field bat buoc (goodFaith, claimantName, claimantEmail...)
  await claim.save({ validateModifiedOnly: true });

  if (action === "approved") {
    // An bai hat: dat copyright.status = "disputed".
    // Dung load + save co guard vi mot so bai hat cu co the luu copyright sai dinh dang
    // (vd: chuoi thay vi object), khien findByIdAndUpdate("copyright.status") bi loi.
    const song = await Song.findById(claim.song._id);
    if (song) {
      const raw = song.toObject().copyright;
      const current = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      // Gan lai ca object (khong mutate tai cho) de tranh loi voi du lieu copyright sai dinh dang
      song.copyright = { ...current, status: "disputed" };
      await song.save({ validateModifiedOnly: true });
    }
    await CopyrightClaim.updateMany(
      { song: claim.song._id, _id: { $ne: claimId }, status: "pending" },
      {
        $set: {
          status:     "rejected",
          adminNote:  "Tu dong tu choi: mot khieu nai khac cho bai hat nay da duoc duyet.",
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      },
    );
  }

  // Gui email thong bao ket qua cho nguoi khieu nai
  const songTitle = claim.song?.title ?? "bai hat";
  sendEmail({
    email:   claim.claimantEmail,
    subject: action === "approved"
      ? `Khieu nai ban quyen da duoc duyet - ${songTitle}`
      : `Ket qua xu ly khieu nai ban quyen - ${songTitle}`,
    html: resolveHtml({ name: claim.claimantName, songTitle, action, adminNote }),
  }).catch(() => {});

  return { success: true, data: claim };
};

module.exports = {
  createClaimService,
  getClaimsService,
  getMyClaimsService,
  resolveClaimService,
};
