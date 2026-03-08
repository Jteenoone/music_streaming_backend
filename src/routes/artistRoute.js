const express = require("express");
const router = express.Router();
const artistController = require("../app/controllers/artistController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

router.post("/", verifyAdmin, artistController.createArtist);
router.get("/", artistController.getAllArtists);
router.get("/:id", artistController.getArtistById);
router.put("/:id", verifyAdmin, artistController.updateArtist);
router.delete("/:id", verifyAdmin, artistController.deleteArtist);

module.exports = router;
