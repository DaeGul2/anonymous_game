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

module.exports = {
  register,
  login
};
