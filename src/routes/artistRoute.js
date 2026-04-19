const express = require("express");
const router = express.Router();
const artistController = require("../app/controllers/artistController");
const { verifyAdmin, verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, verifyAdmin, artistController.createArtist);
router.get("/", artistController.getAllArtists);
router.get("/:id/songs", artistController.getArtistSongs);
router.get("/:id", artistController.getArtistById);
router.put("/:id", verifyToken, verifyAdmin, artistController.updateArtist);
router.delete("/:id", verifyToken, verifyAdmin, artistController.deleteArtist);

module.exports = router;
