import mongoose from "mongoose";

// Refactor the property schema to include reference to the user who created it
const propertySchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, "Please enter your property's address"],
    },
    availability: {
        type: String,
        enum: ["Available", "Rented"],
        default: "Available",
        required: true,
    },
    amenities: [
        {
            name: {
                type: String,
                required: [true, "Please enter your property's amenities"],
            },
        },
    ],
    
    category: {
        type: String,
        required: [true, "Please enter your property's category"],
    },
    phone: {
        type: String,
        required: [true, "Please enter your telephone number"],
    },
    description: {
        type: String,
        required: [true, "Please enter your property's description"],
    },
    images: [
        {
            public_id: String,
            url: String,
        },
    ],
    location: {
        type: String,
        required: [true, "Please enter the location of your property"],
    },
    price: {
        type: Number,
        required: [true, "Please enter your property's price per month"],
    },
    yearBuilt: {
        type: Number,
        required: [true, "Please enter your property's year of construction"],
    },
    reviews: [
        {
            reviewer: {
                type: String,
            },
            avatar: {
                public_id: String,
                url: String,
            },
            comment: {
                type: String,
            },
            rating: {
                type: Number,
            },
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const propertyModel = mongoose.model("Property", propertySchema);
export default propertyModel;
