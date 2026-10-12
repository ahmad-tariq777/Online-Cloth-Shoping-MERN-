const mongoose = require('mongoose');
const { GENDERS, PRODUCT_SEASONS } = require('../utils/constants');

const sizeChartRowSchema = new mongoose.Schema(
  { size: { type: String, required: true }, measurements: { type: Map, of: String } },
  { _id: false }
);

const sizeChartSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['upper', 'lower', 'custom'], default: 'custom' },
    unit: { type: String, default: 'inches' },
    columns: { type: [String], default: [] },
    rows: { type: [sizeChartRowSchema], default: [] },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true }, hex: { type: String, trim: true, default: '' } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    gender: { type: String, enum: GENDERS, default: 'unisex' },
    colors: { type: [colorSchema], default: [] },
    season: { type: String, enum: PRODUCT_SEASONS, default: '' },
    sizes: { type: [String], default: [] },
    sizeChart: { type: sizeChartSchema, default: null },
    tags: { type: [String], default: [] },
    brand: { type: String, trim: true, default: '' },
    material: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    salePrice: { type: Number },
    salePercent: { type: Number },
    saleActive: { type: Boolean, default: false },
    saleStartDate: { type: Date },
    saleEndDate: { type: Date },
  },
  {
    collection: 'AddproductCollection',
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('isOnSale').get(function () {
  if (!this.saleActive || !this.salePrice) return false;
  const now = Date.now();
  if (this.saleStartDate && this.saleStartDate.getTime() > now) return false;
  if (this.saleEndDate && this.saleEndDate.getTime() < now) return false;
  return true;
});

productSchema.virtual('effectivePrice').get(function () {
  return this.isOnSale ? this.salePrice : this.price;
});

productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ season: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ saleActive: 1, saleEndDate: 1 });

module.exports = mongoose.model('Product', productSchema);
