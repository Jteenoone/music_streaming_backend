const express = require("express");
const router = express.Router();

const authRoute = require("./authRoute");
const songRoute = require("./songRoute");
const artistRoute = require("./artistRoute");
const historyRoute = require("./historyRoute");

router.use("/auth", authRoute);
router.use("/songs", songRoute);
router.use("/artists", artistRoute);
router.use("/history", historyRoute);

module.exports = router;
