const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendEmail");

const registerService = async (username, email, password) => {
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return {
      success: false,
      status: 400,
      message: "Email này đã được sử dụng",
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    verifyEmailOTP: otp,
    verifyEmailExpires: Date.now() + 5 * 60 * 1000,
  });

  await newUser.save();

  const message = `Xin chào ${username},\n\nMã OTP xác thực tài khoản của bạn là ${otp}. OTP sẽ hết hạn trong 5 phút.`;
  try {
    await sendEmail({
      email: newUser.email,
      subject: "Xác thực Email - SoundWave",
      message: message,
    });
  } catch (error) {
    console.log("Lỗi gửi email");
  }

  return {
    success: true,
    data: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    },
  };
};

const loginService = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {
      success: false,
      status: 400,
      message: "Sai email hoặc mật khẩu không đúng",
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return {
      success: false,
      status: 401,
      message: "Email hoặc mật khẩu không đúng",
    };
  }

  if (!user.isVerified) {
    return {
      success: false,
      status: 403,
      message:
        "Email chưa xác thực. Vui lòng kiểm tra email để xác thực tài khoản",
    };
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {
      success: false,
      status: 404,
      message: "Email không tồn tại",
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;

  await user.save();

  const message = `Xin chào ${user.username},\n\nMã OTP để khôi phục mật khẩu của bạn là: ${otp}\n\nMã này sẽ hết hạn sau 5 phút. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Khôi phục mật khẩu",
      message: message,
    });
    return {
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi mã OTP",
    };
  } catch {
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    return {
      success: false,
      status: 500,
      message: "Lỗi hệ thống, không thể gửi OTP",
    };
  }
};

const resetPasswordService = async (email, otp, newPassword) => {
  const user = await User.findOne({
    email: email,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return {
      success: false,
      status: 400,
      message: "Mã OTP không đúng hoặc đã hết hạn",
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;

  user.resetPasswordOTP = null;
  user.resetPasswordExpires = null;

  await user.save();

  return { success: true };
};

const verifyEmailService = async (email, otp) => {
  const user = await User.findOne({
    email: email,
    verifyEmailOTP: otp,
    verifyEmailExpires: { $gt: Date.now() },
  });

  if (!user) {
    return { success: false, status: 400, message: "Mã OTP không đúng!" };
  }

  user.isVerified = true;
  user.verifyEmailOTP = null;
  user.verifyEmailExpires = null;
  await user.save();

  return { success: true };
};
module.exports = {
  registerService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
  verifyEmailService,
};
