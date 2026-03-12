const ListeningHistory = require("../models/listeningHistoryModel");

const addHistoryService = async (userId, songId) => {
  const newHistory = new ListeningHistory({ user: userId, song: songId });
  await newHistory.save();
  return { success: true, data: newHistory };
};

const getHistoryService = async (userId) => {
  const history = await ListeningHistory.find({ user: userId })
    .populate({
      path: "song",
      select: "title coverImage audioUrl duration",
      populate: { path: "artist", select: "name" },
    })
    .sort({ listenedAt: -1 })
    .limit(50);

  const songsList = history.map((record) => record.song).filter(Boolean);

  return { success: true, data: songsList };
};

const deleteHistoryService = async (historyId, userId) => {
  const deletedHistory = await ListeningHistory.findOneAndDelete({
    _id: historyId,
    user: userId,
  });
  if (!deletedHistory) {
    return { success: false, status: 404, message: "Không tìm thấy lịch sử " };
  }
  return { success: true };
};

module.exports = { addHistoryService, getHistoryService, deleteHistoryService };
