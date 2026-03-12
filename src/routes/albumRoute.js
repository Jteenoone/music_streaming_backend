const express = require("express");
const router = express.Router();
const albumController = require("../app/controllers/albumController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

router.post("/", verifyAdmin, albumController.createAlbum);

router.get("/", albumController.getAllAlbums);
router.get("/:id", albumController.getAlbumById);

router.put("/:id", verifyAdmin, albumController.updateAlbum);
router.delete("/:id", verifyAdmin, albumController.deleteAlbum);

router.post("/:id/add-song", verifyAdmin, albumController.addSongToAlbum);
router.put(
  "/:id/remove-song",
  verifyAdmin,
  albumController.removeSongFromAlbum,
);
module.exports = router;
