// server/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_and_long_jwt_key'; 

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Authorization header missing");

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user payload to the request
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message); // Log the error
        return res.status(403).send("Invalid or expired token");
    }
};

module.exports = authenticateToken; 


