const Album = require("../models/albumModel");

const createAlbumService = async (data) => {
  const newAlbum = new Album(data);
  await newAlbum.save();
  return { success: true, data: newAlbum };
};

const getAllAlbumsService = async () => {
  const albums = await Album.find().populate("artist", "name imageUrl");
  return { success: true, data: albums };
};

const getAlbumByIdService = async (albumId) => {
  const album = await Album.findById(albumId)
    .populate("artist", "name bio imageUrl")
    .populate({
      path: "songs",
      select: "title audioUrl duration coverImage playCount genre",
      populate: { path: "artist", select: "name" },
    });
  if (!album) {
    return { success: false, status: 404, message: "Không tìm thấy Album!" };
  }
  return { success: true, data: album };
};

const updateAlbumService = async (albumId, data) => {
  if (data.songs) {
    delete data.songs;
  }
  const updateAlbum = await Album.findByIdAndUpdate(albumId, data, { new: true });
  if (!updateAlbum) {
    return { success: false, status: 404, message: "Không tìm thấy Album" };
  }
  return { success: true, data: updateAlbum };
};

const deleteAlbumService = async (albumId) => {
  const result = await Album.findByIdAndDelete(albumId);
  if (!result) {
    return { success: false, status: 404, message: "Không có Album để xoá" };
  }
  return { success: true };
};

const addSongToAlbumService = async (albumId, songId) => {
  const updatedAlbum = await Album.findByIdAndUpdate(
    albumId,
    { $addToSet: { songs: songId } },
    { new: true },
  ).populate("songs", "title");
  if (!updatedAlbum) {
    return { success: false, status: 404, message: "Không tìm thấy Album" };
  }
  return { success: true, data: updatedAlbum };
};

const removeSongFromAlbumService = async (albumId, songId) => {
  const updatedAlbum = await Album.findByIdAndUpdate(
    albumId,
    { $pull: { songs: songId } },
    { new: true },
  );
  if (!updatedAlbum) {
    return { success: false, status: 404, message: "Không tìm thấy Album" };
  }
  return { success: true, data: updatedAlbum };
};

module.exports = {
  createAlbumService,
  getAllAlbumsService,
  getAlbumByIdService,
  updateAlbumService,
  deleteAlbumService,
  addSongToAlbumService,
  removeSongFromAlbumService,
};
