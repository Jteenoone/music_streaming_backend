const express = require("express");
const router = express.Router();
const userController = require("../app/controllers/userController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, userController.getMyProfile);
router.put("/", verifyToken, userController.updateMyProfile);

module.exports = router;
