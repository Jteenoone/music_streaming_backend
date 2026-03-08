const express = require("express");
const router = express.Router();
const songController = require("../app/controllers/songController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

router.post("/", verifyAdmin, songController.createSong);
router.get("/", songController.getAllSongs);
router.get("/:id", songController.getSongById);
router.put("/:id", verifyAdmin, songController.updateSong);
router.delete("/:id", verifyAdmin, songController.deleteSong);

module.exports = router;
