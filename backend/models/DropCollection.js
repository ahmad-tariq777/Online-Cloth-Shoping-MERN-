const mongoose = require('mongoose');
const { GENDERS, COLLECTION_SEASONS } = require('../utils/constants');

const dropProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    gender: { type: String, enum: GENDERS, default: 'unisex' },
  },
  { _id: false }
);

const dropCollectionSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true },
    season: { type: String, enum: COLLECTION_SEASONS, default: 'none' },
    heading: { type: String, default: '' },
    subheading: { type: String, default: '' },
    body: { type: String, default: '' },
    image: { type: String, default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    linkedProducts: { type: [dropProductSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DropCollection', dropCollectionSchema);
