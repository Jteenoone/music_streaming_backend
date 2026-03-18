const express = require("express");
const router = express.Router();
const songController = require("../app/controllers/songController");
const { verifyAdmin, verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../app/utils/cloudinaryConfig");

router.post(
  "/",
  verifyAdmin,
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  songController.createSong,
);
router.put("/:id/play", verifyToken, songController.incrementPlayCount);
router.get("/trending", songController.getTrendingSong);
router.get("/search", songController.search);
router.get("/", songController.getAllSongs);
router.get("/:id", songController.getSongById);
router.put("/:id", verifyAdmin, songController.updateSong);
router.delete("/:id", verifyAdmin, songController.deleteSong);

module.exports = router;
