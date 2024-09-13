import express from 'express';
import { addProperty, getAllProperties, getPropertiesByUserId } from '../controllers/property.controller.js';
import { authorizeRoles, isAuthenticated } from '../middleware/auth.middleware.js';
import { upload, uploadErrorHandler } from '../middleware/uploader.middleware.js';


const propertyRouter = express.Router();

// Route to add a new property
propertyRouter.post("/add-property", isAuthenticated, authorizeRoles("admin", "landlord"), upload, uploadErrorHandler, addProperty);

// Route to get all properties
propertyRouter.get("/get-properties", getAllProperties);

// Route to get properties by user ID
propertyRouter.get("/user-properties/:userId", isAuthenticated, getPropertiesByUserId);


export default propertyRouter;