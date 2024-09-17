import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { acceptViewingRequest, createViewingRequest, deleteUserViewing, getOwnerViewingRequests, getPropertyViewings, getUserViewings, rejectViewingRequest } from '../controllers/viewing.controllers.js';

const viewingRouter = express.Router();


// Route to accept a viewing request
viewingRouter.put('/viewings/:requestId/accept', isAuthenticated, acceptViewingRequest);

// Route to reject a viewing request
viewingRouter.put('/viewings/:requestId/reject', isAuthenticated, rejectViewingRequest);

// Define more specific routes first
viewingRouter.get('/viewings/owner-requests', isAuthenticated, getOwnerViewingRequests);

// Route to get all viewing requests for a user
viewingRouter.get('/get-viewings', isAuthenticated, getUserViewings);

// Route to get all viewing requests for a property
viewingRouter.get('/viewings/:propertyId', isAuthenticated, getPropertyViewings);

// Route to create a viewing request
viewingRouter.post('/create-viewing', isAuthenticated, createViewingRequest);

// Route to delete a viewing request
viewingRouter.delete('/viewings/:id', isAuthenticated, deleteUserViewing);


export default viewingRouter;
