const Artist = require("../models/artistModel");
const Song = require("../models/songModel");

const createArtistService = async (data) => {
  const newArtist = new Artist(data);
  await newArtist.save();
  return { success: true, data: newArtist };
};

const getAllArtistsService = async () => {
  const artists = await Artist.find();
  return { success: true, data: artists };
};

const getArtistByIdService = async (artistId) => {
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return { success: false, status: 404, message: "Không tìm thấy Artist" };
  }
  return { success: true, data: artist };
};

const updateArtistService = async (artistId, data) => {
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return { success: false, status: 404, message: "Không tìm thấy Artist" };
  }
  Object.assign(artist, data);
  await artist.save();
  return { success: true, data: artist };
};

const deleteArtistService = async (artistId) => {
  const deletedArtist = await Artist.findByIdAndDelete(artistId);
  if (!deletedArtist) {
    return { success: false, status: 404, message: "Không tìm thấy Artist" };
  }
  return { success: true };
};

const getArtistSongsService = async (artistId) => {
  const artist = await Artist.findById(artistId);
  if (!artist) return { success: false, status: 404, message: "Không tìm thấy Artist" };
  const songs = await Song.find({ artist: artistId })
    .populate("artist", "name imageUrl")
    .sort({ playCount: -1 });
  return { success: true, data: { artist, songs } };
};

module.exports = {
  createArtistService,
  getAllArtistsService,
  getArtistByIdService,
  getArtistSongsService,
  updateArtistService,
  deleteArtistService,
};
