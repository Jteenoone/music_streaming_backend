const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD") // Tách chữ và dấu ra riêng
    .replace(/[\u0300-\u036f]/g, "") // Xóa hết các dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

module.exports = removeAccents;
