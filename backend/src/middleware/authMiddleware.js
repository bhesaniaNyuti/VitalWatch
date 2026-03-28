const jwt = require('jsonwebtoken');
const store = require('../data/inMemoryStore');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = store.users.find((item) => item._id === decoded.id);
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            };

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
