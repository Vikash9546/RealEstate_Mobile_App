const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const user = await User.create({ name, email, password, role, phone });
        const token = generateToken(user._id);
        res.status(201).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        user.isOnline = true;
        await user.save();
        const token = generateToken(user._id);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    try {
        req.user.isOnline = false;
        req.user.lastSeen = new Date();
        await req.user.save();
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    res.json(req.user);
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updates = { name, phone };
        if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, logout, getMe, updateProfile };
