const authService = require("../services/authService");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap day du thong tin" });
    }

    const result = await authService.registerService(username, email, password);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.status(201).json({
      message: "Dang ky thanh cong",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "Loi he thong" });
  }
};

//API dang nhap

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui long nhap email va mat khau" });
    }
    //email
    const result = await authService.loginService(email, password);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({
      message: "Dang nhap thanh cong",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

module.exports = { register, login };
