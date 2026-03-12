const Playlist = require("../models/playlistModel");
const PlaylistSong = require("../models/playlistSongModel");

const createPlaylistService = async (name, userId) => {
  const newPlaylist = new Playlist({ name, user: userId });
  await newPlaylist.save();
  return { success: true, data: newPlaylist };
};

const addSongToPlaylistService = async (songId, userId, playlistId) => {
  const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
  if (!playlist) {
    return {
      success: false,
      status: 404,
      message: "Playlist này không tồn tại",
    };
  }
  const existingRecord = await PlaylistSong.findOne({ playlistId, songId });
  if (existingRecord) {
    return {
      success: false,
      status: 400,
      message: "Playlist đã có bài hát này",
    };
  }
  const newPlaylistSong = new PlaylistSong({
    playlistId: playlistId,
    songId: songId,
  });
  await newPlaylistSong.save();
  return { success: true };
};

const getUserPlaylistsService = async (userId) => {
  const playlists = await Playlist.find({ user: userId });
  return { success: true, data: playlists };
};

const getPlaylistByIdService = async (playlistId, userId) => {
  const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
  if (!playlist) {
    return {
      success: false,
      status: 404,
      message: "Playlist này không tồn tại hoặc bạn không có quyền",
    };
  }

  const playlistSongs = await PlaylistSong.find({ playlistId })
    .populate({
      path: "songId",
      select: "title coverImage audioUrl duration",
      populate: {
        path: "artist",
        select: "name",
      },
    })
    .sort({ addedAt: -1 });

  const songsList = playlistSongs.map((record) => record.songId);
  return { success: true, data: { ...playlist._doc, songs: songsList } };
};

const removeSongFromPlaylistService = async (playlistId, songId, userId) => {
  const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
  if (!playlist) {
    return {
      success: false,
      status: 404,
      message: "Playlist này không tồn tại hoặc bạn không có quyền",
    };
  }

  const deletedRecord = await PlaylistSong.findOneAndDelete({
    playlistId,
    songId,
  });
  if (!deletedRecord) {
    return {
      success: false,
      status: 404,
      message: "Playlist không có bài hát này",
    };
  }
  return { success: true };
};

const deletePlaylistService = async (playlistId, userId) => {
  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    user: userId,
  });
  if (!deletedPlaylist) {
    return {
      success: false,
      status: 404,
      message: "Không tìm thấy playlist nào",
    };
  }

  await PlaylistSong.deleteMany({ playlistId });
  return { success: true };
};

module.exports = {
  createPlaylistService,
  addSongToPlaylistService,
  getUserPlaylistsService,
  getPlaylistByIdService,
  removeSongFromPlaylistService,
  deletePlaylistService,
};
