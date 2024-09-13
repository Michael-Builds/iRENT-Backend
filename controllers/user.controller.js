import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    ACCESS_TOKEN,
    ACCESS_TOKEN_EXPIRY,
    ACTIVATION_SECRET,
    REFRESH_TOKEN,
    REFRESH_TOKEN_EXPIRY,
    RESET_PASSWORD_SECRET
} from '../config/index.js';
import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import notificationModel from "../model/notification.model.js";
import userModel from "../model/user.model.js";
import { getUserById } from "../services/user.services.js";
import { clearCache, setCache } from "../utils/catche.manage.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import { sendEmail } from "../utils/sendEmail.js";


export const register = CatchAsyncErrors(async (req, res, next) => {
    const { firstname, lastname, email, password, avatar } = req.body;

    try {
        const isEmailExist = await userModel.exists({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400));
        }

        const user = new userModel({
            firstname,
            lastname,
            email,
            password,
            avatar: {
                public_id: avatar?.public_id,
                url: avatar?.url,
            }
        });

        await user.save();

        // Generate an activation token and code for the new user
        const { token, activationCode } = createActivationToken(user);

        const data = { user: { firstname: user.firstname }, activationCode };

        // Create a notification for account deactivation
        await notificationModel.create({
            userId: user._id,
            title: "New Account Registration",
            message: `An account for ${user.firstname} ${user.lastname} has been created successfully`,
        });

        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-email.ejs",
            data,
        });

        res.status(201).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account`,
            activationToken: token
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


export const createActivationToken = (user) => {
    // Generate a random 4-digit activation code
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // Create a JWT token that includes the user's email and the activation code
    const token = jwt.sign(
        { user: { email: user.email }, activationCode },
        ACTIVATION_SECRET,
        { expiresIn: "24h" }
    );
    // Return the generated token and the activation code
    return { token, activationCode };
}


export const resendActivationCode = CatchAsyncErrors(async (req, res, next) => {
    const { activation_token } = req.body;

    try {
        const decoded = jwt.verify(activation_token, ACTIVATION_SECRET);
        const { email } = decoded.user;

        const user = await userModel.findOne({ email });

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (user.isVerified) {
            return next(new ErrorHandler("User is already verified", 400));
        }

        // Generate a new activation token and code
        const { token, activationCode } = createActivationToken(user);

        const data = {
            user: { fullname: `${user.firstname} ${user.lastname}` },
            activationCode
        };

        await sendEmail({
            email: user.email,
            subject: "Activate your account",
            template: "activation-email.ejs",
            data,
        });

        res.status(200).json({
            success: true,
            message: `A new activation code has been sent to: ${user.email}`,
            activationToken: token
        });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Activation token has expired", 400));
        } else if (err.name === 'JsonWebTokenError') {
            return next(new ErrorHandler("Invalid activation token", 400));
        }
        return next(new ErrorHandler("Resend activation code failed", 500));
    }
});


export const acccountActivation = CatchAsyncErrors(async (req, res, next) => {
    const { activation_token, activation_code } = req.body;

    if (!activation_token) {
        return next(new ErrorHandler("Activation token must be provided", 400));
    }

    try {
        const decoded = jwt.verify(activation_token, ACTIVATION_SECRET);
        const { user, activationCode } = decoded;

        if (activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const existingUser = await userModel.findOne({ email: user.email });

        if (!existingUser) {
            return next(new ErrorHandler("User not found", 404));
        }

        if (existingUser.isVerified) {
            return next(new ErrorHandler("User is already verified", 400));
        }

        existingUser.isVerified = true;
        await existingUser.save();

        res.status(200).json({
            success: true,
            message: "Account activated successfully",
        });

    } catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});


export const login = CatchAsyncErrors(async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }

        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        const now = new Date();

        // Check if the user account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            return next(new ErrorHandler("Your account is locked due to multiple failed login attempts. Please try again later.", 403));
        }

        // Compare the provided password with the stored hashed password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            // Increment login attempts
            user.loginAttempts += 1;
            user.failedLoginTimestamps.push(new Date());


            // Check if there have been 3 failed attempts in the last 24 hours
            const recentFailedAttempts = user.failedLoginTimestamps.filter(
                (timestamp) => now.getTime() - timestamp.getTime() <= 24 * 60 * 60 * 1000
            );

            if (recentFailedAttempts.length >= 3) {
                if (!user.lockUntil) {
                    user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                } else {
                    user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    if (recentFailedAttempts.length >= 6) {
                        user.lockUntil = null;
                        accountSuspension(user);
                        return next(new ErrorHandler("Your account has been suspended due to multiple failed login attempts.", 403));
                    }
                }
                user.loginAttempts = 0;
            }

            await user.save();
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.failedLoginTimestamps = [];
        await user.save();

        // Save user session in Redis with a 1-hour expiration
        await setCache(user?.id, user, 3600)

        sendToken(user, 200, res)
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
})


export const logout = CatchAsyncErrors(async (req, res, next) => {
    try {
        // Clear the access token cookie by setting its maxAge to 1 millisecond
        res.cookie("access_token", "", { maxAge: 1, httpOnly: true });

        // Clear the refresh token cookie by setting its maxAge to 1 millisecond
        res.cookie("refresh_token", "", { maxAge: 1, httpOnly: true });

        // Extract the authenticated user from the request object

        const { user } = req;
        if (user) {
            await clearCache(user._id);
        }
        // Send a success response to the client indicating the user has been logged out
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });

    } catch (error) {
        return next(new ErrorHandler("Internal Server Error", 500));
    }
})


export const resetPasswordRequest = CatchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    try {
        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ErrorHandler("User not found with this email", 404));
        }

        // Generate a 4-digit reset code and JWT token
        const { token, activationCode } = createResetPasswordCode(user);

        // Send email with reset code
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            template: "reset-password.ejs",
            data: {
                firstname: user.firstname,
                resetCode: activationCode,
            },
        });

        res.status(200).json({
            success: true,
            message: `A password reset code has been sent to ${user.email}`,
            resetToken: token,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Reset password function
export const resetPassword = CatchAsyncErrors(async (req, res, next) => {
    const { token, activationCode, newPassword } = req.body;

    try {
        // Verify the reset token
        const decoded = jwt.verify(token, RESET_PASSWORD_SECRET);

        // Check if the provided reset code matches the one stored in the token
        if (decoded.activationCode !== activationCode) {
            return next(new ErrorHandler("Invalid reset code", 400));
        }

        // Find the user using the ID stored in the token
        const user = await userModel.findById(decoded.user.id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Hash the new password and save it
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully",
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ErrorHandler("Reset token has expired", 400));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new ErrorHandler("Invalid reset token", 400));
        }
        return next(new ErrorHandler("Password reset failed", 500));
    }
});


// Create reset password token
export const createResetPasswordCode = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
        { user: { id: user._id }, activationCode },
        RESET_PASSWORD_SECRET,
        { expiresIn: "24h" }
    );
    return { token, activationCode };
};

// Update access token handler
export const updateAccessToken = CatchAsyncErrors(async (req, res, next) => {
    try {
        const refresh_token = req.cookies.refresh_token || req.body.refresh_token;
        if (!refresh_token) {
            return next(new ErrorHandler("Refresh token is missing", 400));
        }

        const decoded = jwt.verify(refresh_token, REFRESH_TOKEN);
        if (!decoded) {
            return next(new ErrorHandler("Invalid refresh token", 400));
        }

        const session = await redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }

        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, ACCESS_TOKEN, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });

        const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        await setCache(user?.id, user, 604800);

        res.status(200).json({
            success: true,
            accessToken,
        });
    } catch (err) {
        console.error("Token refresh failed:", err.message);  // Log the error
        return next(new ErrorHandler("Authorization failed", 500));
    }
});


export const getUserInfo = CatchAsyncErrors(async (req, res, next) => {
    try {
        let userId;

        // Check for access token in cookies
        const accessToken = req.cookies.access_token;
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, ACCESS_TOKEN);
                userId = decoded.id;
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    // Attempt to refresh the token
                    updateAccessToken(req, res, next);
                    // Check if the token refresh was successful
                    if (req.user) {
                        userId = String(req.user._id);
                    } else {
                        return next(new ErrorHandler("Session expired", 401));
                    }
                } else {
                    return next(new ErrorHandler("Invalid token", 401));
                }
            }
        } else {
            return next(new ErrorHandler("No access token found", 401));
        }
        if (!userId) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        // Retrieve user details from Redis or database
        const userSession = await redis.get(userId);

        if (userSession) {
            const userDetails = JSON.parse(userSession);
            res.status(200).json({
                success: true,
                message: "User retrieved successfully",
                user: userDetails
            });
        } else {
            await getUserById(userId, res);
        }
    } catch (err) {
        return next(new ErrorHandler(err.message, 400));
    }
})