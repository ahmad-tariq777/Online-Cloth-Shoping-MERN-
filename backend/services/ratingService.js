const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

const recalculateRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.average * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

module.exports = { recalculateRating };
