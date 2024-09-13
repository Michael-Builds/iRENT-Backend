import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ACCESS_TOKEN, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRY } from "../config/index.js";

const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "Please enter your first name"],
    },
    lastname: {
        type: String,
        required: [true, "Please enter your last name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        match: [emailRegexPattern, "Please provide a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [8, "Password must be at least 8 characters"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: null,
        },
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'landlord'],
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },

    hostels_underreview: [{
        hostelId: {
            type: String,
            ref: "Hostel",
        }
    }],
    chosen_hostel: {
        hostelId: {
            type: String,
            ref: "Hostel",
        }
    },
    hasRequestedDeactivation: {
        type: Boolean,
        default: false,
    },
    deactivationDate: {
        type: Date,
    },
    recoveryToken: {
        type: String,
    },
    recoveryTokenExpiry: {
        type: Date,
    },
    loginAttempts: {
        type: Number,
        required: true,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    failedLoginTimestamps: {
        type: [Date],
        default: [],
    },
}, { timestamps: true });


// Hash password before saving it to the database
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
        return next(error);
    }
    next();
});

// Method to sign the access token
userSchema.methods.signAccessToken = function () {
    try {
        return jwt.sign({ id: this._id }, ACCESS_TOKEN || "", {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });
    } catch (error) {
        throw new Error("Could not generate access token");
    }
};

// Method to sign the refresh token
userSchema.methods.signRefreshToken = function () {
    try {
        return jwt.sign({ id: this._id }, REFRESH_TOKEN || "", {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });
    } catch (error) {
        throw new Error("Could not generate refresh token");
    }
};


// Compare Password Configuration
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);
export default userModel