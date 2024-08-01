const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendRegistrationEmail = require("../utils/sendEmail");
const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phoneNumber,
      role,
      userType,
      firstSchool,
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create a new user
    user = new User({
      username,
      email,
      password,
      phoneNumber,
      role,
      userType,
      firstSchool,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    sendRegistrationEmail(email);

    // const payload = { user: { id: user.id } };
    // jwt.sign(payload, JWT_SECRET, { expiresIn: "3d" }, (err, token) => {
    //   if (err) throw err; // Handle JWT signing error
    //   res.json({
    //     msg: "Registration successful. Please check your email for confirmation.",
    //   });
    // });

    // uncomment if jwt requires when register
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal server error");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate JWT
    const payload = { user: { id: user.id } };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "3d" }, (err, token) => {
      if (err) {
        console.error("JWT signing error:", err.message);
        return res.status(500).json({ msg: "Error signing token" });
      }
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal server error");
  }
};

// forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, password, securityQuestionAnswer } = req.body;

    const user = await User.findOne({
      email,
      password,
      securityQuestionAnswer,
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or invalid details" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    await user.save();

    const resetURL = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

    transporter.sendMail({
      to: email,
      from: process.env.SMTP_USER,
      subject: "Password Reset",
      text: `You requested a password reset. Click the link to reset your password: ${resetURL}`,
    });
    res.json({ message: "Password reset link sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Internal server error");
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token and check if the token is not expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Clear the reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Internal server error");
  }
};
