const Artist = require("../models/artistModel");

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
  const updatedArtist = await Artist.findByIdAndUpdate(artistId, data, {
    new: true,
  });
  if (!updatedArtist) {
    return { success: false, status: 404, message: "Không tìm thấy Artist" };
  }
  return { success: true, data: updatedArtist };
};

const deleteArtistService = async (artistId) => {
  const deletedArtist = await Artist.findByIdAndDelete(artistId);
  if (!deletedArtist) {
    return { success: false, status: 404, message: "Không tìm thấy Artist" };
  }
  return { success: true };
};

module.exports = {
  createArtistService,
  getAllArtistsService,
  getArtistByIdService,
  updateArtistService,
  deleteArtistService,
};
