const favoriteService = require("../services/favoriteService");
const Favorite = require("../models/favoriteModel");

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Vui long cung cap ID bai hat" });
    }

    const result = await favoriteService.toggleFavoriteService(userId, songId);
    const statusCode = result.action === "added" ? 201 : 200;
    res.status(statusCode).json({ message: result.message, favorited: result.action === "added" });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.params;
    const fav = await Favorite.findOne({ userId, songId });
    res.status(200).json({ favorited: !!fav });
  } catch {
    res.status(500).json({ message: "Loi he thong" });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const songsList = await favoriteService.getMyFavoritesService(userId);
    res.status(200).json({
      message: "Lay danh sach bai hat yeu thich thanh cong",
      total: songsList.length,
      data: songsList,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

module.exports = { toggleFavorite, checkFavorite, getMyFavorites };
