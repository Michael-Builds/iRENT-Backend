import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { ErrorMiddleware } from "./middleware/error.js";
import userRouter from './routes/user.route.js';
import propertyRouter from './routes/property.route.js';
import favoritesRouter from './routes/favorites.route.js';
import viewingRouter from './routes/viewing.route.js';

export const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

// routes
app.use("/auth/api", userRouter);
app.use("/property/api", propertyRouter);
app.use("/favorites/api", favoritesRouter);
app.use("/viewing/api", viewingRouter);


app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.status = 404;
    next(err);
})

app.use(ErrorMiddleware);