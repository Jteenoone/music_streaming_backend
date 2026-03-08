const Artist = require("../models/artistModel");

const createArtist = async (req, res) => {
  try {
    const { name, imageUrl, bio, nationality } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Vui long nhap ten" });
    }

    const newArtist = new Artist({
      name,
      imageUrl,
      bio,
      nationality,
    });

    await newArtist.save();
    res.status(201).json({ message: "Tao ca si thanh cong", data: newArtist });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find();

    res.status(200).json({
      message: "danh sach ca si",
      data: artists,
      total: artists.length,
    });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const getArtistById = async (req, res) => {
  try {
    const artistId = req.params.id;
    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404 ).json({ message: "Khong tim thay ca si" });
    }
    res.status(200).json({ message: "Da tim thay", data: artist });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const updateArtist = async (req, res) => {
  try {
    const artistId = req.params.id;
    const updatedArtist = await Artist.findByIdAndUpdate(artistId, req.body, {
      new: true,
    });
    if (!updatedArtist) {
      return res
        .status(404)
        .json({ message: "Khong tim thay ca si de cap nhat" });
    }
    res.status(200).json({ message: "Da cap nhat", data: updatedArtist });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const deleteArtist = async (req, res) => {
  try {
    const artistId = req.params.id;
    const deletedArtist = await Artist.findByIdAndDelete(artistId);
    if (!deletedArtist) {
      return res.status(404).json({ message: "Khong co ca si de xoa" });
    }
    res.status(200).json({ message: "Da xoa" });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

module.exports = {
  createArtist,
  getAllArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
};
