const { User } = require('../models/Game');
const bcrypt = require('bcrypt');


const register = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const existingUser = await User.findOne({ user_id });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ user_id, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    req.session.user_id = user._id;

    res.status(200).json({ message: 'User logged in successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkLoginStatus = (req, res) => {
  if (req.session.user_id) {
    res.status(200).json({ loggedIn: true, user_id: req.session.user_id });
  } else {
    res.status(200).json({ loggedIn: false });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.status(200).json({ message: 'User logged out successfully' });
  });
};

module.exports = {
  register,
  login,
  checkLoginStatus,
  logout
};