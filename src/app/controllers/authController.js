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
      message: "Đăng nhập thành công",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ message: "loi he thong" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }
    const result = await authService.forgotPasswordService(email);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const result = await authService.resetPasswordService(
      email,
      otp,
      newPassword,
    );

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        message: "Vui lòng cung cấp đầy đủ email và otp",
      });
    }
    const result = await authService.verifyEmailService(email, otp);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.status(200).json({ message: "Xác thực Email thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
