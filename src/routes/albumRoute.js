const express = require("express");
const router = express.Router();
const albumController = require("../app/controllers/albumController");
const { verifyAdmin, verifyToken } = require("../middlewares/authMiddleware");
const upload = require("../app/utils/cloudinaryConfig");

router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  albumController.createAlbum,
);

router.get("/", albumController.getAllAlbums);
router.get("/:id", albumController.getAlbumById);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  albumController.updateAlbum,
);
router.delete("/:id", verifyToken, verifyAdmin, albumController.deleteAlbum);

// songs in album
router.post("/:id/songs", verifyToken, verifyAdmin, albumController.addSongToAlbum);
router.delete(
  "/:id/songs/:songId",
  verifyToken,
  verifyAdmin,
  albumController.removeSongFromAlbum,
);

module.exports = router;
