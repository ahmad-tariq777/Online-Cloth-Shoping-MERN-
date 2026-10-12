const mongoose = require('mongoose');
const { slugify } = require('../utils/text');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'Categories', timestamps: true }
);

categorySchema.pre('save', function () {
  if (this.isModified('name')) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Category', categorySchema);
