const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    },
    bio: {
      type: String,
      trim: true,
      default: "Updating",
    },
    nationality: {
      type: String,
      default: "Unknown",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Artist", artistSchema);
