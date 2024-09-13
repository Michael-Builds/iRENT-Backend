import cloudinary from "cloudinary";
import { CatchAsyncErrors } from "../middleware/catchAsyncError.js";
import notificationModel from "../model/notification.model.js";
import userModel from "../model/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createProperty } from "../services/property.services.js";
import propertyModel from "../model/property.model.js";
import { clearCache, setCache } from "../utils/catche.manage.js";
import { redis } from "../utils/redis.js";


// Controller to handle property addition
export const addProperty = CatchAsyncErrors(async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user?._id);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const { address, availability, amenities, category, phone, description, location, price, yearBuilt } = req.body;

        // Ensure category is a string
        if (typeof category !== 'string') {
            return next(new ErrorHandler("Invalid category format", 400));
        }

        // Validate yearBuilt
        const parsedYearBuilt = parseInt(yearBuilt, 10);
        if (isNaN(parsedYearBuilt)) {
            return next(new ErrorHandler("Invalid year built", 400));
        }

        // Convert amenities array of strings to array of objects (if needed)
        const formattedAmenities = amenities.map((amenity) => {
            return typeof amenity === 'string' ? { name: amenity } : amenity;
        });


        if (!req.files || !req.files.length) {
            return next(new ErrorHandler("At least one property image is required", 400));
        }

        let uploadedImages = [];
        for (const file of req.files) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream({ folder: "properties" }, (error, result) => {
                    if (error) {
                        reject(new ErrorHandler("Image upload failed", 500));
                    } else {
                        uploadedImages.push({
                            public_id: result.public_id,
                            url: result.secure_url,
                        });
                        resolve(result);
                    }
                });
                uploadStream.end(file.buffer);
            });
        }

        const propertyData = {
            address,
            availability,
            amenities: formattedAmenities,
            category,
            phone,
            description,
            images: uploadedImages,
            location,
            price: parseFloat(price),
            yearBuilt: parsedYearBuilt,
            createdBy: user,
        };

        const property = await createProperty(propertyData);

        // Send confirmation email
        await sendEmail({
            email: user.email,
            subject: "Property Uploaded Successfully",
            template: "property-upload.ejs",
            data: { user, property },
        });

        // Create a notification
        await notificationModel.create({
            userId: user._id,
            title: "New Property Registration",
            message: `A new property has been uploaded by ${user.firstname} ${user.lastname}`,
        });

        await clearCache('properties:all');

        await setCache(`property:${property._id}`, property, 3600);

        res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: { user, property },
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Controller to fetch all properties with populated user information
export const getAllProperties = CatchAsyncErrors(async (req, res, next) => {
    try {
        // Check if all properties are cached in Redis
        const cachedProperties = await redis.get('properties:all');
        if (cachedProperties) {
            return res.status(200).json({
                success: true,
                message: "Properties retrieved from cache",
                properties: JSON.parse(cachedProperties),
            });
        }

        // If not cached, fetch properties from the database
        const properties = await propertyModel.find().populate('createdBy');

        // Check if no properties exist
        if (properties.length === 0) {
            return next(new ErrorHandler('No properties found', 404));
        }

        // Cache the fetched properties for future requests (TTL of 1 hour)
        await setCache('properties:all', properties, 3600);

        // Send response with properties from the database
        res.status(200).json({
            success: true,
            count: properties.length,
            properties,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});


// Controller to fetch properties by user ID with caching
export const getPropertiesByUserId = CatchAsyncErrors(async (req, res, next) => {
    const userId = req.params.userId;

    try {
        // Check if properties for this userId are cached
        const cachedProperties = await redis.get(`properties:user:${userId}`);
        if (cachedProperties) {
            return res.status(200).json({
                success: true,
                message: "Properties retrieved from cache",
                properties: JSON.parse(cachedProperties),
            });
        }

        // If not cached, fetch from the database
        const properties = await propertyModel
            .find({ createdBy: userId })
            .populate('createdBy');

        // Check if no properties found for this user
        if (!properties || properties.length === 0) {
            return next(new ErrorHandler(`No properties found for user with ID ${userId}`, 404));
        }

        // Cache the properties for future requests (cache for 1 hour)
        await setCache(`properties:user:${userId}`, properties, 3600);

        // Send response with user's properties
        res.status(200).json({
            success: true,
            message: "Properties retrieved",
            properties,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});