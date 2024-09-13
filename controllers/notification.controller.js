import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import notificatioModel from "../model/notification.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";

//get all notifications handler for admin
export const getNotifications = CatchAsyncErrors(async (req, res, next) => {
    try {
        const notifications = await notificatioModel.find().sort({ createdAt: -1 })

        res.status(201).json({
            success: true,
            message: "Notifications Retrieved",
            notifications
        })
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
})

// update notification status handler for admin
export const updateNotifications = CatchAsyncErrors(async (req, res, next) => {
    try {

        const notification = await notificatioModel.findById(req.params.id);

        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        } else {
            if (notification.status !== 'read') {
                notification.status = 'read';
            }
        }

        await notification.save();

        // Fetch updated notifications
        const notifications = await notificatioModel.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            message: "Message read successfully",
            notifications
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// Fetches user notifications
export const getUserNotifications = CatchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        // Fetch notifications for the logged-in user
        const notifications = await notificatioModel.find({ userId: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "User notifications retrieved successfully",
            notifications,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});