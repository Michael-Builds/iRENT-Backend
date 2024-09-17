import mongoose from 'mongoose';

// Accepted Request Schema
const acceptedRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    preferredDate: {
        type: Date,
        required: true,
    },
    viewingType: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    acceptedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const acceptedRequestModel = mongoose.model('AcceptedRequest', acceptedRequestSchema);

// Rejected Request Schema
const rejectedRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    preferredDate: {
        type: Date,
        required: true,
    },
    viewingType: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rejectedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const rejectedRequestModel = mongoose.model('RejectedRequest', rejectedRequestSchema);

export { acceptedRequestModel, rejectedRequestModel };
