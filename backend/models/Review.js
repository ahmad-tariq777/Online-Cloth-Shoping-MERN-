const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '', maxlength: 150 },
    body: { type: String, trim: true, default: '', maxlength: 2000 },
    images: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    helpfulBy: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
  },
  { collection: 'ReviewCollection', timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
