import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import notificationModel from "../model/notification.model.js";
import propertyModel from "../model/property.model.js";
import viewingModel from "../model/viewing.model.js";
import { clearCache, setCache } from "../utils/catche.manage.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// Controller to create a viewing request
export const createViewingRequest = CatchAsyncErrors(async (req, res, next) => {
    try {
        const { propertyId, preferredDate, viewingType } = req.body;
        const userId = req.user._id;
        const user = req.user;

        // Check if the property exists
        const property = await propertyModel.findById(propertyId);
        if (!property) {
            return next(new ErrorHandler("Property not found", 404));
        }

        // Parse the preferred date
        const requestedDate = new Date(preferredDate);
        requestedDate.setHours(0, 0, 0, 0);

        // Check if a viewing exists for the same property and user on the same date
        const existingViewing = await viewingModel.findOne({
            user: userId,
            property: propertyId,
            preferredDate: requestedDate
        });

        if (existingViewing) {
            return next(new ErrorHandler("You already have a viewing request for this property on the same day.", 400));
        }

        // Create a new viewing request
        const viewing = new viewingModel({
            user: userId,
            property: propertyId,
            preferredDate: requestedDate,
            viewingType
        });

        // Save the viewing request to the database
        await viewing.save();

        // Send confirmation email to the user
        await sendEmail({
            email: user.email,
            subject: "Viewing Request Confirmation",
            template: "viewing-confirmation-email.ejs",
            data: { user, property, viewing },
        });

        // Create a notification
        await notificationModel.create({
            userId: user._id,
            title: `Viewing request for ${property.address} by ${user.firstname} ${user.lastname}`,
            message: `Viewing request made for ${property.address}. Preferred date: ${preferredDate}.`,
        });

        // Clear and update cache for viewings
        await clearCache('viewings:all');
        await setCache(`viewing:${viewing._id}`, viewing, 3600);

        res.status(201).json({
            success: true,
            message: "Viewing request created successfully",
            viewing
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Controller to fetch all viewing requests for a user
export const getUserViewings = CatchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Fetch all viewing requests for the logged-in user
    const viewings = await viewingModel.find({ user: userId }).populate('property');

    if (!viewings || viewings.length === 0) {
        return next(new ErrorHandler("No viewing requests found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Viewing requests retrieved successfully",
        viewings
    });
});

// Controller to get all viewing requests for a specific property
export const getPropertyViewings = CatchAsyncErrors(async (req, res, next) => {
    const { propertyId } = req.params;

    // Check if the property exists
    const property = await propertyModel.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // Fetch all viewing requests for the property
    const viewings = await viewingModel.find({ property: propertyId }).populate('user');

    if (!viewings || viewings.length === 0) {
        return next(new ErrorHandler("No viewing requests found for this property", 404));
    }

    res.status(200).json({
        success: true,
        message: "Viewing requests for the property retrieved successfully",
        viewings
    });
});
