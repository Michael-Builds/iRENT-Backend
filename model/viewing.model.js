import mongoose from 'mongoose';

const viewingSchema = new mongoose.Schema({
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
        default: Date.now
    },
    viewingType: {
        type: String,
        required: [true, "Please enter your preferred type"],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },

}, { timestamps: true });

const viewingModel = mongoose.model('Viewing', viewingSchema);
export default viewingModel;
