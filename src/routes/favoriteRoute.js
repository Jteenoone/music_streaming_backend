const express = require("express");
const router = express.Router();
const favoriteController = require("../app/controllers/favoriteController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/toggle", verifyToken, favoriteController.toggleFavorite);
router.get("/", verifyToken, favoriteController.getMyFavorites);

module.exports = router;
