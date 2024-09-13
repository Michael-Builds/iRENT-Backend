import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import favoriteModel from "../model/favorites.model.js";
import propertyModel from "../model/property.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Controller to toggle a property in favorites
export const toggleFavorite = CatchAsyncErrors(async (req, res, next) => {
    const { propertyId } = req.body;

    const userId = req.user._id;

    // Check if the property exists
    const property = await propertyModel.findById(propertyId);
    if (!property) {
        return next(new ErrorHandler("Property not found", 404));
    }

    // Check if the property is already in the user's favorites
    const existingFavorite = await favoriteModel.findOne({ user: userId, property: propertyId });

    if (existingFavorite) {
        // Property is already favorited, remove it
        await favoriteModel.deleteOne({ _id: existingFavorite._id });

        return res.status(200).json({
            success: true,
            message: "Property removed from favorites",
        });
    } else {
        // Property is not in favorites, add it
        const favorite = new favoriteModel({
            user: req.user,
            property: property
        });

        await favorite.save();

        return res.status(201).json({
            success: true,
            message: "Property added to favorites",
            favorite
        });
    }
});


// Controller to get all favorite properties of a user
export const getUserFavorites = CatchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Get all favorite properties for the user, including populated property details
    const favorites = await favoriteModel.find({ user: userId }).populate('property');

    if (!favorites || favorites.length === 0) {
        return next(new ErrorHandler("You have no favorite properties", 404));
    }

    res.status(200).json({
        success: true,
        message: "Favorites retrieved successfully",
        favorites
    });
});
