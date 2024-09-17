import express from 'express';
import {
    acccountActivation,
    getAllUsers,
    getUserInfo,
    login,
    logout,
    register,
    resendActivationCode,
    resetPassword,
    resetPasswordRequest,
    updateAccessToken,
    updateUserRole
} from '../controllers/user.controller.js';
import { authorizeRoles, isAuthenticated } from '../middleware/auth.middleware.js';
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

// Admin-Only Routes
userRouter.get("/all-users", isAuthenticated, authorizeRoles("admin"), getAllUsers);
userRouter.put("/update-role", isAuthenticated, authorizeRoles("admin"), updateUserRole);

export default userRouter;


