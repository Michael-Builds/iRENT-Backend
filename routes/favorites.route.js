import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { getUserFavorites, toggleFavorite } from '../controllers/favorite.controller.js';

const favoritesRouter = express.Router();

favoritesRouter.post('/toggle-favorites', isAuthenticated, toggleFavorite);

favoritesRouter.get('/get-favorites', isAuthenticated, getUserFavorites);

export default favoritesRouter;