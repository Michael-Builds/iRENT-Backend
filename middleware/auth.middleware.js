import jwt from "jsonwebtoken";
import { ACCESS_TOKEN } from "../config/index.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { redis } from "../utils/redis.js";
import { CatchAsyncErrors } from "./catchAsyncError.js";


export const isAuthenticated = CatchAsyncErrors(async (req, res, next) => {

    const access_token = req.cookies.access_token || req.headers['authorization']?.split(' ')[1];

    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    try {
        const decoded = jwt.verify(access_token, ACCESS_TOKEN);

        if (!decoded) {
            return next(new ErrorHandler("Invalid access token", 401));
        }
        const user = await redis.get(decoded.id);

        if (!user) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }
        req.user = JSON.parse(user);
        next();
    } catch (error) {
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
