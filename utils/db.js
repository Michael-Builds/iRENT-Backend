import mongoose from "mongoose";
import colors from "colors";
import { DATABASE } from "../config/index.js";

export const connectDB = async () => {
    try {
        if (!DATABASE) {
            throw new Error("Database connection string is not defined");
        }

        await mongoose.connect(DATABASE).then((data) => {
            console.log(colors.bgGreen.white('Database Connected Successfully!'));
        })
    } catch (err) {
        console.log(colors.bgRed.white(`Error Connecting to Database: ${err.message}`));
    }
}