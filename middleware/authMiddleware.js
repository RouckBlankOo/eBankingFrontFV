const User = require("../database/models/User");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    try {
        // Get the Authorization header
        const authHeader = req.header("Authorization");
        console.log("🔍 Auth Header:", authHeader);

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        // Extract token from "Bearer TOKEN"
        let token;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
        } else {
            token = authHeader; // In case token is sent without Bearer prefix
        }

        console.log("🎫 Extracted Token:", token.substring(0, 20) + "...");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("✅ Token decoded successfully:", decoded);
        } catch (error) {
            console.error("❌ JWT Error:", error.message);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please log in again.",
                });
            }
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token. Please log in again.",
                });
            }
            return res.status(500).json({
                success: false,
                message: "Authentication error.",
            });
        }

        // Find the user by ID
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.error("❌ User not found for ID:", decoded.userId);
            return res.status(404).json({
                success: false,
                message: "User not found. Please log in.",
            });
        }

        console.log("✅ User found:", user.email);
        req.user = user;
        next();
    } catch (err) {
        console.error("💥 Auth Middleware Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

module.exports = auth;