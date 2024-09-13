import multer from 'multer';
import path from 'path';


// Use memory storage for file uploads
const storage = multer.memoryStorage();  // Files will be stored in memory as Buffer

// File filter to only allow image file types
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Error: Only images are allowed!"), false);
    }
};

// Middleware to upload up to 3 images
export const upload = multer({
    storage: storage, // In-memory storage
    limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB limit
    fileFilter: fileFilter,
}).array("images", 3);

// Handle file upload errors (e.g., file type, size)
export const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred (e.g., file too large)
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
            success: false,
            message: err.message || 'Error occurred during file upload.',
        });
    }
    next();
};
