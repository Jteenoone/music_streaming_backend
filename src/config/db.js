const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Success to connect");
  } catch (error) {
    console.log("fail to connect");
    process.exit(1);
  }
};

module.exports = connectDB;
