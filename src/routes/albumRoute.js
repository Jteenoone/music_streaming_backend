const express = require("express");
const router = express.Router();
const albumController = require("../app/controllers/albumController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

router.post("/", verifyAdmin, albumController.createAlbum);

router.get("/", albumController.getAllAlbums);
router.get("/:id", albumController.getAlbumById);

router.put("/:id", verifyAdmin, albumController.updateAlbum);
router.delete("/:id", verifyAdmin, albumController.deleteAlbum);

// songs in album
router.post("/:id/songs", verifyAdmin, albumController.addSongToAlbum);
router.delete(
  "/:id/songs/:songId",
  verifyAdmin,
  albumController.removeSongFromAlbum,
);

module.exports = router;
