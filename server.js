import { app } from "./app.js";
import colors from "colors";
import { PORT, NODE_ENV, CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY } from "./config/index.js";
import { connectDB } from "./utils/db.js";
import { v2 as cloudinary } from "cloudinary";


// Cloudinary configuration
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_SECRET_KEY
})


app.listen(PORT, () => {
    console.log(colors.bgCyan.white(`Server running in ${NODE_ENV} mode on port ${PORT}`))
    connectDB();
});
