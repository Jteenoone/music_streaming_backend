const express = require("express");
const router = express.Router();
const albumController = require("../app/controllers/albumController");
const { verifyAdmin, verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, verifyAdmin, albumController.createAlbum);

router.get("/", albumController.getAllAlbums);
router.get("/:id", albumController.getAlbumById);

router.put("/:id", verifyToken, verifyAdmin, albumController.updateAlbum);
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
