import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { createViewingRequest, getPropertyViewings, getUserViewings } from '../controllers/Viewing.controller.js';

const viewingRouter = express.Router();

// Route to create a viewing request
viewingRouter.post('/create-viewing', isAuthenticated, createViewingRequest);

// Route to get all viewing requests for a user
viewingRouter.get('/get-viewings', isAuthenticated, getUserViewings);

// Route to get all viewing requests for a property
viewingRouter.get('/viewings/:propertyId', isAuthenticated, getPropertyViewings);

export default viewingRouter;
