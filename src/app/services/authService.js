const User = require("../models/userModel");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const registerService = async (username, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
      success: false,
      status: 400,
      message: "Email này đã được sử dụng",
    };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();

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
      status: 400,
      message: "Email hoặc mật khẩu không đúng",
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

module.exports = { registerService, loginService };
