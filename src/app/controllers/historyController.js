const historyService = require("../services/historyService");

const addHistory = async (req, res) => {
  try {
    const { songId } = req.body;
    const userId = req.user.id;

    if (!songId) {
      return res.status(400).json({ message: "Thieu ID bai hat" });
    }

    const result = await historyService.addHistoryService(userId, songId);

    // Đã bổ sung check success để phòng hờ tương lai nâng cấp Service
    if (!result.success) {
      return res.status(result.status || 400).json({ message: result.message });
    }

    res.status(201).json({ message: "Da luu lich su nghe nhac" });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await historyService.getHistoryService(userId);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Lay lich su nghe nhac thanh cong",
      total: result.data.length,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const historyId = req.params.id; // ID cua lich su
    const userId = req.user.id; // ID chinh chu moi duoc xoa

    const result = await historyService.deleteHistoryService(historyId, userId);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Da xoa thanh cong" });
  } catch (error) {
    // Đã sửa lỗi thiếu số 500 ở đây!
    res.status(500).json({ message: "Loi he thong" });
  }
};

module.exports = { addHistory, getHistory, deleteHistory };
