const express = require("express");
const router = express.Router();
const listeningHistoryController = require("../app/controllers/historyController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/", verifyToken, listeningHistoryController.addHistory);
router.get("/", verifyToken, listeningHistoryController.getHistory);

module.exports = router;
