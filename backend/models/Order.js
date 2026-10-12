const mongoose = require('mongoose');
const crypto = require('crypto');
const {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DELIVERY_FEE,
} = require('../utils/constants');
const { PHONE_REGEX, POSTAL_CODE_REGEX } = require('../utils/validators');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 100 },
  image: { type: String },
  size: { type: String },
});

const deliveryDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phoneNumber: { type: String, required: true, match: [PHONE_REGEX, 'Invalid Pakistani phone number'] },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, match: [POSTAL_CODE_REGEX, 'Invalid postal code'] },
    country: { type: String, required: true, default: 'Pakistan' },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    transactionId: { type: String, trim: true },
    senderNumber: { type: String, trim: true },
    transactionScreenshot: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    amount: { type: Number, required: true },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: String },
  changedAt: { type: Date, default: Date.now },
  note: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    userId: { type: String, required: true },
    items: { type: [orderItemSchema], required: true, validate: (items) => items.length > 0 },
    deliveryDetails: { type: deliveryDetailsSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: DELIVERY_FEE },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: { type: paymentSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
    statusHistory: [statusHistorySchema],
    estimatedDelivery: { type: Date },
    trackingNumber: { type: String },
    adminNotes: { type: String, maxlength: 1000 },
    cancellationReason: { type: String },
    stockRestored: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
});

orderSchema.methods.setStatus = function (status, changedBy = 'system', note) {
  this.status = status;
  this.statusHistory.push({ status, changedBy: String(changedBy), note: note || undefined });
};

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
