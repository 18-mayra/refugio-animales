const jwt = require("jsonwebtoken");

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

exports.generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        ACCESS_SECRET,
        { expiresIn: "15m" }
    );
};

exports.generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

exports.verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_SECRET);
};