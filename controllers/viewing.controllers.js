import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import notificationModel from "../model/notification.model.js";
import propertyModel from "../model/property.model.js";
import { acceptedRequestModel, rejectedRequestModel } from "../model/requests.js";
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

        // Check if the property exists and populate the 'createdBy' field
        const property = await propertyModel.findById(propertyId).populate('createdBy').exec();

        if (!property) {
            return next(new ErrorHandler("Property not found", 404));
        }

        // Parse the preferred date
        const requestedDate = new Date(preferredDate);
        requestedDate.setHours(0, 0, 0, 0);

        // Check if the user has already made any viewing request for the same property
        const existingViewing = await viewingModel.findOne({
            user: userId,
            property: propertyId
        }).exec();

        if (existingViewing) {
            return next(new ErrorHandler("You have already requested to view this property.", 400));
        }

        // Identify the owner of the property from the createdBy field
        const ownerId = property.createdBy._id || property.createdBy;
        const ownerEmail = property.createdBy.email;
        const ownerName = `${property.createdBy.firstname}`;

        // Identify the owner of the property from the createdBy field
        if (!ownerId || !ownerEmail) {
            return next(new ErrorHandler("Property owner not found.", 404));
        }

        // Create a new viewing request
        const viewing = new viewingModel({
            user: userId,
            property: propertyId,
            preferredDate: requestedDate,
            viewingType,
            owner: ownerId
        });

        // Save the viewing request to the database
        await viewing.save();

        // Send confirmation email to the user
        await sendEmail({
            email: user.email,
            subject: "Viewing Request Confirmation",
            template: "viewing-confirmation-email.ejs",
            data: {
                user: user,
                property: property,
                viewing: viewing
            },
        });

        // Send notification email to the property owner
        await sendEmail({
            email: ownerEmail,
            subject: "New Viewing Request for Your Property",
            template: "owner-viewing-notification.ejs",
            data: {
                ownerName: ownerName,
                propertyAddress: property.address,
                userName: `${user.firstname} ${user.lastname}`,
                requestedDate: requestedDate.toDateString(),
                viewingType: viewingType
            },
        });


        // Create a notification for the viewing request
        await notificationModel.create({
            userId: user._id,
            title: "Viewing Request Created",
            message: `A viewing request for property at ${property.address} has been successfully created.`
        });

        // Send response
        res.status(200).json({
            success: true,
            message: "Viewing request created successfully.",
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

// Controller to delete a viewing request
export const deleteUserViewing = CatchAsyncErrors(async (req, res, next) => {
    const viewingId = req.params.id;
    const userId = req.user._id;

    // Check if the viewing exists and belongs to the user
    const viewing = await viewingModel.findOne({ _id: viewingId, user: userId });
    if (!viewing) {
        return next(new ErrorHandler("Viewing not found or you do not have permission to delete this viewing", 404));
    }

    // Use deleteOne to remove the viewing from the database
    const result = await viewingModel.deleteOne({ _id: viewingId, user: userId });

    // Check if the deletion was successful
    if (result.deletedCount === 0) {
        return next(new ErrorHandler("Failed to delete the viewing", 500));
    }

    // Clear the cache
    await clearCache('viewings:all');
    await clearCache(`viewing: ${viewingId}`);

    res.status(200).json({
        success: true,
        message: "Viewing deleted successfully",
    });
});

// Controller to fetch all viewing requests for a specific owner
export const getOwnerViewingRequests = CatchAsyncErrors(async (req, res, next) => {
    const ownerId = req.user._id; // Owner's ID from logged-in user

    // Find all properties owned by this owner
    const ownerProperties = await propertyModel.find({ createdBy: ownerId }).select('_id');

    if (!ownerProperties || ownerProperties.length === 0) {
        return next(new ErrorHandler("No properties found for this owner", 404));
    }

    // Extract the property IDs
    const propertyIds = ownerProperties.map(property => property._id);

    // Find all viewing requests where the property belongs to the owner
    const viewings = await viewingModel.find({ property: { $in: propertyIds } })
        .populate('property')  // Populate the property details
        .populate('user');     // Populate the user who made the request

    if (!viewings || viewings.length === 0) {
        return next(new ErrorHandler("No viewing requests found for your properties", 404));
    }

    res.status(200).json({
        success: true,
        message: "Viewing requests for your properties retrieved successfully",
        viewings
    });
});


// Accept viewing request
export const acceptViewingRequest = CatchAsyncErrors(async (req, res, next) => {
    const { requestId } = req.params;

    // Find the viewing request by ID
    const viewingRequest = await viewingModel.findById(requestId).populate('property').populate('user');

    if (!viewingRequest) {
        return next(new ErrorHandler("Viewing request not found", 404));
    }

    // Ensure only the owner of the property can accept the request
    if (viewingRequest.owner.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to accept this request", 403));
    }

    // Create a new accepted request document in the AcceptedRequest model
    const acceptedRequest = new acceptedRequestModel({
        user: viewingRequest.user._id,
        property: viewingRequest.property._id,
        preferredDate: viewingRequest.preferredDate,
        viewingType: viewingRequest.viewingType,
        owner: viewingRequest.owner,
        acceptedAt: new Date()
    });

    await acceptedRequest.save(); // Save the accepted request

    // Remove the viewing request from the Viewing model
    await viewingModel.deleteOne({ _id: requestId });

    // Send a notification for the accepted request
    await notificationModel.create({
        userId: viewingRequest.user._id,
        title: "Viewing Request Accepted",
        message: `Your request to view the property at ${viewingRequest.property.address} has been accepted.`
    });

    // Send confirmation email to the user
    await sendEmail({
        email: viewingRequest.user.email,
        subject: "Viewing Request Accepted",
        template: "viewing-request-accepted.ejs",
        data: {
            user: viewingRequest.user,
            property: viewingRequest.property,
            viewing: acceptedRequest
        },
    });

    res.status(200).json({
        success: true,
        message: "Viewing request accepted and moved to accepted requests.",
        acceptedRequest
    });
});


// Reject viewing request
export const rejectViewingRequest = CatchAsyncErrors(async (req, res, next) => {
    const { requestId } = req.params;

    // Find the viewing request by ID
    const viewingRequest = await viewingModel.findById(requestId).populate('property').populate('user');

    if (!viewingRequest) {
        return next(new ErrorHandler("Viewing request not found", 404));
    }

    // Ensure only the owner of the property can reject the request
    if (viewingRequest.owner.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to reject this request", 403));
    }

    // Create a new rejected request document in the RejectedRequest model
    const rejectedRequest = new rejectedRequestModel({
        user: viewingRequest.user._id,
        property: viewingRequest.property._id,
        preferredDate: viewingRequest.preferredDate,
        viewingType: viewingRequest.viewingType,
        owner: viewingRequest.owner,
        rejectedAt: new Date()
    });

    await rejectedRequest.save(); // Save the rejected request

    // Remove the viewing request from the Viewing model
    await viewingModel.deleteOne({ _id: requestId });

    // Send a notification for the rejected request
    await notificationModel.create({
        userId: viewingRequest.user._id,
        title: "Viewing Request Rejected",
        message: `Your request to view the property at ${viewingRequest.property.address} has been rejected.`
    });

    // Send rejection email to the user
    await sendEmail({
        email: viewingRequest.user.email,
        subject: "Viewing Request Rejected",
        template: "viewing-request-rejected.ejs",
        data: {
            user: viewingRequest.user,
            property: viewingRequest.property,
            viewing: rejectedRequest
        },
    });

    res.status(200).json({
        success: true,
        message: "Viewing request rejected and moved to rejected requests.",
        rejectedRequest
    });
});