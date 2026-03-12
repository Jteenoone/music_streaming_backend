const favoriteService = require("../services/favoriteService");

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Không tìm thấy bài hát nào" });
    }

    const result = await favoriteService.toggleFavoriteService(userId, songId);

    const statusCode = result.action === "added" ? 201 : 200;

    res.status(statusCode).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const songsList = await favoriteService.getMyFavoritesService(userId);
    res
      .status(200)
      .json({
        message: "Lấy danh sách bài hát yêu thích thành công",
        total: songsList.length,
        data: songsList,
      });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = { toggleFavorite, getMyFavorites };
