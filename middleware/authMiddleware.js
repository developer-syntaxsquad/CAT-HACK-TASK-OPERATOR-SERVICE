const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: "Access token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.operator_id = decoded.sub; // sub is the operator_id
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        res.status(403).json({ error: "Invalid or expired token" });
    }
};

module.exports = authenticateToken;
