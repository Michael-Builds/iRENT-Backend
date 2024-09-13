import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
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
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const favoriteModel = mongoose.model('Favorite', favoriteSchema);
export default favoriteModel;
