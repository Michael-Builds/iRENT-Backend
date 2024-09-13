import express from 'express';
import {
    acccountActivation,
    getUserInfo,
    login,
    logout,
    register,
    resendActivationCode,
    resetPassword,
    resetPasswordRequest,
    updateAccessToken
} from '../controllers/user.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getUserNotifications } from '../controllers/notification.controller.js';

const userRouter = express.Router();

// Public Routes
userRouter.post("/register", register);
userRouter.post("/account-activate", acccountActivation);
userRouter.post("/login", login);
userRouter.post("/forgot-password", resetPasswordRequest);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/resend-activation", resendActivationCode);
userRouter.post("/refresh-token", updateAccessToken);

// Authenticated User Routes
userRouter.get("/logout", isAuthenticated, logout); 
userRouter.get("/user-info", isAuthenticated, getUserInfo);
userRouter.get("/user-notifications", isAuthenticated, getUserNotifications);

export default userRouter;


