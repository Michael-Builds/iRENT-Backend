import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "unread",
        enum: ['read', 'unread'],
    },
}, { timestamps: true });

const notificationModel = mongoose.model("Notification", notificationSchema);

export default notificationModel;
