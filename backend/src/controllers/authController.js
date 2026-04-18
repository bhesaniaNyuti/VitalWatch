const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const store = require('../data/inMemoryStore');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const ALLOWED_ROLES = new Set(['doctor', 'nurse', 'patient']);

const normalizeRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    return ALLOWED_ROLES.has(normalized) ? normalized : null;
};

exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedRole = normalizeRole(role);

        if (!normalizedRole) {
            return res.status(400).json({ message: 'Role must be doctor, nurse, or patient' });
        }

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
            role: normalizedRole,
            createdAt: new Date().toISOString(),
        };

        store.users.push(user);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
    const { email, password, role } = req.body;

    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedRole = normalizeRole(role);
        const user = store.users.find((item) => item.email === normalizedEmail);

        if (normalizedRole && user && user.role !== normalizedRole) {
            return res.status(401).json({ message: `This account is not registered as ${normalizedRole}` });
        }

        if (user && (await bcrypt.compare(String(password || ''), user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
