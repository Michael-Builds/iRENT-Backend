import ErrorHandler from "../utils/ErrorHandler.js";

export const ErrorMiddleware = (req, res, next) => {
    // Set default status and message if not provided
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";

    // Handle Mongoose bad ObjectId error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // Handle invalid JWT error
    if (err.name === "JsonWebTokenError") {
        const message = "JSON Web Token is invalid, try again";
        err = new ErrorHandler(message, 400);
    }

    // Handle expired JWT error
    if (err.name === "TokenExpiredError") {
        const message = "JSON Web Token is expired, try again";
        err = new ErrorHandler(message, 400);
    }

    // Send response with error status and message
    res.status(err.status).json({
        success: false,
        message: err.message,
    });
}