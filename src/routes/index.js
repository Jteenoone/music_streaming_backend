const express = require("express");
const router = express.Router();

const authRoute = require("./authRoute");
const songRoute = require("./songRoute");
const artistRoute = require("./artistRoute");
const historyRoute = require("./historyRoute");
const playlistRoute = require("./playlistRoute");
const albumRoute = require("./albumRoute");
const favoriteRoute = require("../routes/favoriteRoute");
const userRoute = require("../routes/userRoute");
const claimRoute = require("../routes/claimRoute");

router.use("/auth", authRoute);
router.use("/songs", songRoute);
router.use("/artists", artistRoute);
router.use("/history", historyRoute);
router.use("/playlists", playlistRoute);
router.use("/albums", albumRoute);
router.use("/favorites", favoriteRoute);
router.use("/user", userRoute);
router.use("/claims", claimRoute);

module.exports = router;
