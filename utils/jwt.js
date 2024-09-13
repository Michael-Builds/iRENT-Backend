import { ACCESS_TOKEN_EXPIRY, NODE_ENV, REFRESH_TOKEN_EXPIRY } from "../config/index.js";
import { redis } from "./redis.js";

// Parse the environment variables and provide default values
const accessTokenExpiry = ACCESS_TOKEN_EXPIRY || '24h';
const refreshTokenExpiry = REFRESH_TOKEN_EXPIRY || '7d';

// Helper function to convert time string to milliseconds
const timeToMs = (timeString) => {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1), 10);
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
};

// Set options for the access token cookie
export const accessTokenOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === 'production' ? true : false, // Set to false for local development
    maxAge: timeToMs(accessTokenExpiry),
    expires: new Date(Date.now() + timeToMs(accessTokenExpiry)),
};

// Set options for the refresh token cookie
export const refreshTokenOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === 'production' ? true : false, // Set to false for local development
    maxAge: timeToMs(refreshTokenExpiry),
    expires: new Date(Date.now() + timeToMs(refreshTokenExpiry)),
};

// Send token function
export const sendToken = (user, statusCode, res) => {
    try {
        // Ensure that signAccessToken and signRefreshToken methods are implemented on the user model
        const accessToken = user.signAccessToken();
        const refreshToken = user.signRefreshToken();

        // Upload session to Redis
        const userId = String(user._id);
        redis.set(userId, JSON.stringify(user));

        // Set cookies
        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        // Send response with token information
        res.status(statusCode).json({
            success: true,
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("Error sending tokens:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create and send tokens."
        });
    }
};
