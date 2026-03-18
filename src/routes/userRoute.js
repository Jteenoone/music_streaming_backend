const express = require("express");
const router = express.Router();
const userController = require("../app/controllers/userController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/me", verifyToken, userController.getMyProfile);
router.put("/me", verifyToken, userController.updateMyProfile);
router.put("/change-password", verifyToken, userController.changePassword);
router.get("/", verifyToken, verifyAdmin, userController.getAllUsers);
router.delete("/:id", verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;
