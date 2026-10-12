const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { toPublicPath } = require('../utils/files');
const { getPagination, pageMeta } = require('../utils/pagination');
const { isStaff } = require('../middleware/auth');
const { recalculateRating } = require('../services/ratingService');

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1 },
  lowest: { rating: 1 },
  helpful: { helpful: -1 },
};

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const parseRating = (value) => {
  const rating = Number(value);
  if (value === undefined || value === '' || Number.isNaN(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }
  return rating;
};

const hasPurchased = (userId, productId) =>
  Order.exists({ userId, status: 'Delivered', isDeleted: false, 'items.productId': String(productId) });

const createReview = async (req, res) => {
  const { productId } = req.params;
  const rating = parseRating(req.body.rating);

  if (!(await Product.exists({ _id: productId }))) throw new ApiError(404, 'Product not found');
  if (await Review.exists({ product: productId, user: req.user.userId })) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  let review;
  try {
    review = await Review.create({
      product: productId,
      user: req.user.userId,
      userName: req.user.fullName,
      rating,
      title: req.body.title ? String(req.body.title).trim() : '',
      body: req.body.body ? String(req.body.body).trim() : '',
      images: (req.files || []).map((file) => toPublicPath(file, true)),
      verified: !!(await hasPurchased(req.user.userId, productId)),
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'You have already reviewed this product');
    throw error;
  }

  await recalculateRating(productId);
  res.status(201).json({ message: 'Review submitted', review });
};

const listReviews = async (req, res) => {
  const { productId } = req.params;
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;

  const [reviews, total, ratingBreakdown] = await Promise.all([
    Review.find({ product: productId }).sort(sort).skip(skip).limit(limit).select('-__v'),
    Review.countDocuments({ product: productId }),
    Review.aggregate([
      { $match: { product: toObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingBreakdown.forEach(({ _id, count }) => {
    breakdown[Math.round(_id)] = (breakdown[Math.round(_id)] || 0) + count;
  });

  res.status(200).json({ reviews, ...pageMeta(total, page, limit), breakdown });
};

const findOwnedReview = async (id, user, allowStaff = false) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Review not found');
  const isOwner = String(review.user) === user.userId;
  if (!isOwner && !(allowStaff && isStaff(user))) throw new ApiError(403, 'Not authorized');
  return review;
};

const updateReview = async (req, res) => {
  const review = await findOwnedReview(req.params.reviewId, req.user);
  const { rating, title, body } = req.body;

  if (rating !== undefined) review.rating = parseRating(rating);
  if (title !== undefined) review.title = String(title).trim();
  if (body !== undefined) review.body = String(body).trim();

  await review.save();
  await recalculateRating(review.product);

  res.status(200).json({ message: 'Review updated', review });
};

const deleteReview = async (req, res) => {
  const review = await findOwnedReview(req.params.reviewId, req.user, true);
  await review.deleteOne();
  await recalculateRating(review.product);
  res.status(200).json({ message: 'Review deleted' });
};

const markHelpful = async (req, res) => {
  const { reviewId } = req.params;
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, helpfulBy: { $ne: req.user.userId } },
    { $addToSet: { helpfulBy: req.user.userId }, $inc: { helpful: 1 } },
    { new: true }
  );

  if (!review) {
    if (await Review.exists({ _id: reviewId })) throw new ApiError(409, 'You already marked this review as helpful');
    throw new ApiError(404, 'Review not found');
  }

  res.status(200).json({ helpful: review.helpful });
};

module.exports = { createReview, listReviews, updateReview, deleteReview, markHelpful };
