const User = require("../models/userModel.js");
const generateToken = require("../utils/token.js");

// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter all fields" });
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    if (userExists.email === email) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "User with this username already exists",
      });
    }
  }

  try {
    const user = await User.create({
      username,
      email,
      password, // Password hashed by pre-save middleware
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid user data provided" });
    }
  } catch (error) {
    console.error("Error during user registration:", error);
    let errorMessage = "Server error during registration";
    if (error.name === "ValidationError") {
      errorMessage = error.message;
    } else if (error.code === 11000) {
      errorMessage =
        "Duplicate field value entered. Please use unique values for username and email.";
    }
    res
      .status(500)
      .json({ success: false, message: errorMessage, error: error.message });
  }
};

// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter all fields" });
  }

  // 2. Check for user by email
  const user = await User.findOne({ email });

  // 3. Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      message: "Logged in successfully",
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id), // Generate JWT
    });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" }); // 401 Unauthorized
  }
};

module.exports = {
  registerUser,
  loginUser,
};
