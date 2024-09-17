import jwt from "jsonwebtoken";
import { ACCESS_TOKEN } from "../config/index.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { redis } from "../utils/redis.js";
import { CatchAsyncErrors } from "./catchAsyncError.js";


export const isAuthenticated = CatchAsyncErrors(async (req, res, next) => {
    // Get access token from cookies or authorization header
    const access_token = req.cookies.access_token || req.headers['authorization']?.split(' ')[1];

    
    // Check if the access token is missing
    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(access_token, ACCESS_TOKEN);

        // If token verification fails
        if (!decoded) {
            return next(new ErrorHandler("Invalid access token", 401));
        }

        // Fetch user from Redis using decoded token's user ID
        const user = await redis.get(decoded.id);

        // If no user is found in Redis, the session may have expired or been revoked
        if (!user) {
            return next(new ErrorHandler("Session expired. Please login again.", 401));
        }

        // Attach the user to the request object
        req.user = JSON.parse(user);
        next();
    } catch (error) {
        // Handle specific JWT errors like token expiration
        if (error.name === "TokenExpiredError") {
            return next(new ErrorHandler("Token has expired. Please login again.", 401));
        } else if (error.name === "JsonWebTokenError") {
            return next(new ErrorHandler("Invalid token. Please login again.", 401));
        }

        // For any other errors, return a 500 Internal Server Error
        console.error("Token verification error:", error);
        return next(new ErrorHandler("Invalid or expired token", 500));
    }
});

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        try {
            const user = req.user

            // Check if the user's role is included in the allowed roles
            if (!roles.includes(user.role || "")) {
                // If the role is not authorized, return a 403 Forbidden error
                return next(new ErrorHandler(`Access denied: Role ${user.role} is not authorized to access this resource`, 403));
            }

            next();
        } catch (err) {
            return next(new ErrorHandler("Authorization failed", 500));
        }
    }
}
