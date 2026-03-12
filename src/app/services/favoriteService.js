const Favorite = require("../models/favoriteModel");

const toggleFavoriteService = async (userId, songId) => {
  const existingFavorite = await Favorite.findOne({
    userId: userId,
    songId: songId,
  });

  if (existingFavorite) {
    await Favorite.findByIdAndDelete(existingFavorite._id);
    return { action: "removed", message: "Đã bỏ yêu thích bài hát thành công" };
  } else {
    const newFavorite = new Favorite({ userId: userId, songId: songId });
    await newFavorite.save();
    return { action: "added", message: "Đã thêm bài hát yêu thích thành công" };
  }
};

const getMyFavoritesService = async (userId) => {
  const favorites = await Favorite.find({ userId })
    .populate({
      path: "songId",
      select: "title coverImage audioUrl duration",
      populate: {
        path: "artist",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  return favorites.map((fav) => fav.songId);
};

module.exports = { toggleFavoriteService, getMyFavoritesService };
