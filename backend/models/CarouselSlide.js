const mongoose = require('mongoose');
const { GENDERS, COLLECTION_SEASONS } = require('../utils/constants');

const slideProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    gender: { type: String, enum: GENDERS, default: 'unisex' },
  },
  { _id: false }
);

const carouselSlideSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'LIFESTYLE / FASHION' },
    heading: { type: String, required: true, default: 'OLD' },
    subheading: { type: String, required: true, default: 'MONEY' },
    body: { type: String, default: '' },
    scrollLabel: { type: String, default: 'SCROLL TO SEE ↓' },
    issue: { type: String, default: 'BEFORE 2016' },
    index: { type: String, default: '/ ISSUE 1' },
    image: { type: String, default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    season: { type: String, enum: COLLECTION_SEASONS, default: 'none' },
    collectionName: { type: String, default: '' },
    linkedProducts: { type: [slideProductSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CarouselSlide', carouselSlideSchema);
