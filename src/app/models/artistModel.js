const mongoose = require("mongoose");
const removeAccents = require("../utils/removeAccent");

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameNoAccent: {
      type: String,
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

artistSchema.pre("save", function () {
  if (this.isModified("name") && this.name) {
    this.nameNoAccent = removeAccents(this.name);
  }
});

module.exports = mongoose.model("Artist", artistSchema);
