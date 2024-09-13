import propertyModel from "../model/property.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";


// Service to create a property
export const createProperty = async (data) => {
    try {
        const property = await propertyModel.create(data);
        return property;
    } catch (error) {
        // Handle errors and provide a meaningful message
        throw new ErrorHandler(`Property creation failed: ${error.message}`, 500);
    }
};
