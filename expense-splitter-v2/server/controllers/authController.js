const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// POST /api/auth/logout
// Stateless JWT: logout is handled client-side by discarding the token.
// This endpoint exists for symmetry / future token-blacklisting.
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toSafeObject());
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, password, currency, emailNotifications, inAppNotifications } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (currency !== undefined) user.currency = currency;
    if (emailNotifications !== undefined) user.emailNotifications = Boolean(emailNotifications);
    if (inAppNotifications !== undefined) user.inAppNotifications = Boolean(inAppNotifications);
    if (password) user.password = password;

    await user.save();
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: "Profile update failed", error: err.message });
  }
};
