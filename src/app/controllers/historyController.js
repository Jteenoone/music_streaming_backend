const ListeningHistory = require("../models/listeningHistoryModel");

const addHistory = async (req, res) => {
  try {
    const { songId } = req.body;

    const userId = req.user.id;

    if (!songId) {
      return res.status(400).json({ message: "Thieu ID bai hat" });
    }

    const newHistory = new ListeningHistory({
      user: userId,
      song: songId,
    });
    await newHistory.save();

    res.status(201).json({ message: "Da luu lich su nghe nhac" });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await ListeningHistory.find({ user: userId })
      .sort({ listenedAt: -1 })
      .limit(20)
      .populate({
        path: "song",
        select: "title coverImage audioUrl duration", // Chỉ lấy các trường cần thiết của Bài hát
        populate: {
          path: "artist",
          select: "name", // Móc tiếp sang bảng Ca sĩ để lấy Tên ca sĩ
        },
      });
    res.status(200).json({
      message: "Lay lich su nghe nhac thanh cong",
      total: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

module.exports = { addHistory, getHistory };
