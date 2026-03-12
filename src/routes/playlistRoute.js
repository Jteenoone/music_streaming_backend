const express = require("express");
const router = express.Router();
const playlistController = require("../app/controllers/playlistController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, playlistController.createPlaylist);
router.get("/:id", verifyToken, playlistController.getPlaylistById);
router.post("/:id/add-song", verifyToken, playlistController.addSongToPlaylist);
router.get("/", verifyToken, playlistController.getUserPlayLists);
router.put(
  "/:id/remove-song",
  verifyToken,
  playlistController.removeSongFromPlaylist,
);
router.delete("/:id", verifyToken, playlistController.deletePlaylist);

module.exports = router;
