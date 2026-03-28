const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const store = require('../data/inMemoryStore');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const userExists = store.users.find((user) => user.email === normalizedEmail);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(String(password || ''), 10);

        const user = {
            _id: randomUUID(),
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'patient',
            createdAt: new Date().toISOString(),
        };

        store.users.push(user);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const user = store.users.find((item) => item.email === normalizedEmail);

        if (user && (await bcrypt.compare(String(password || ''), user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
