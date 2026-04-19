const express = require("express");
const router = express.Router();
const userController = require("../app/controllers/userController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/me", verifyToken, userController.getMyProfile);
router.put("/me", verifyToken, userController.updateMyProfile);
router.put("/change-password", verifyToken, userController.changePassword);
router.get("/library", verifyToken, userController.getLibrary);
router.post("/recently-played/:songId", verifyToken, userController.recordPlay);
router.get("/recently-played", verifyToken, userController.getRecentlyPlayed);
router.post("/follow-artist/:artistId", verifyToken, userController.toggleFollowArtist);
router.post("/save-album/:albumId", verifyToken, userController.toggleSaveAlbum);
router.get("/", verifyToken, verifyAdmin, userController.getAllUsers);
router.delete("/:id", verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;
