const ApiError = require('../utils/ApiError');
const { isObjectId } = require('../utils/validators');
const { cleanText } = require('../utils/text');
const {
  PAYMENT_METHODS,
  DIGITAL_PAYMENT_METHODS,
} = require('../utils/constants');
const { PHONE_REGEX, POSTAL_CODE_REGEX } = require('../utils/validators');

const paramObjectId = (req, res, next, value, name) => {
  if (!isObjectId(value)) return next(new ApiError(400, `Invalid ${name}`));
  next();
};

const DELIVERY_FIELDS = ['fullName', 'phoneNumber', 'address', 'city', 'postalCode'];

const validateOrderInput = (req, res, next) => {
  const { items, deliveryDetails, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new ApiError(400, 'Invalid items array');
  }

  req.body.items = items.map((item) => {
    if (!item || !isObjectId(String(item.productId))) throw new ApiError(400, 'Each item needs a valid productId');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new ApiError(400, 'Invalid item quantity');
    }
    const size = cleanText(item.size);
    return { productId: String(item.productId), quantity: item.quantity, size: size || undefined };
  });

  const delivery = {};
  for (const field of DELIVERY_FIELDS) {
    const value = cleanText(deliveryDetails?.[field]);
    if (!value) throw new ApiError(400, `Missing delivery field: ${field}`);
    delivery[field] = value;
  }
  if (!PHONE_REGEX.test(delivery.phoneNumber)) throw new ApiError(400, 'Invalid phone number format');
  if (!POSTAL_CODE_REGEX.test(delivery.postalCode)) throw new ApiError(400, 'Invalid postal code');
  delivery.country = cleanText(deliveryDetails?.country) || 'Pakistan';
  req.body.deliveryDetails = delivery;

  if (!payment?.method || !PAYMENT_METHODS.includes(payment.method)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  const cleanPayment = { method: payment.method, notes: cleanText(payment.notes).slice(0, 500) || undefined };

  if (DIGITAL_PAYMENT_METHODS.includes(payment.method)) {
    const transactionId = cleanText(payment.transactionId);
    const senderNumber = cleanText(payment.senderNumber);
    if (!transactionId || !senderNumber) {
      throw new ApiError(400, 'Transaction ID and sender number required for digital payments');
    }
    if (!PHONE_REGEX.test(senderNumber)) throw new ApiError(400, 'Invalid sender phone number format');
    cleanPayment.transactionId = transactionId;
    cleanPayment.senderNumber = senderNumber;
    cleanPayment.transactionScreenshot =
      typeof payment.transactionScreenshot === 'string' ? payment.transactionScreenshot : undefined;
  }

  req.body.payment = cleanPayment;
  next();
};

module.exports = { paramObjectId, validateOrderInput };
