import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { ErrorMiddleware } from "./middleware/error.js";
import favoritesRouter from './routes/favorites.route.js';
import propertyRouter from './routes/property.route.js';
import userRouter from './routes/user.route.js';
import viewingRouter from './routes/viewing.route.js';

export const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());

const allowedOrigins = ['https://i-rent-frontend.vercel.app', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Define a root route
app.get('/', (req, res) => {
    res.send('Welcome to the iRent API');
});

// Routes
app.use("/auth/api", userRouter);
app.use("/property/api", propertyRouter);
app.use("/favorites/api", favoritesRouter);
app.use("/viewing/api", viewingRouter);

// Handle 404 errors for unknown routes
app.all("*", (req, res, next) => {
    res.status(404).json({
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use(ErrorMiddleware);
