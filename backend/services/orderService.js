const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { DELIVERY_FEE, RESTOCK_FROM_STATUSES } = require('../utils/constants');
const { notifyUser } = require('./notificationService');

const adjustStock = (items, direction) =>
  Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.productId }, { $inc: { quantity: direction * item.quantity } })
    )
  );

const reserveStock = async (lines) => {
  const reserved = [];
  for (const line of lines) {
    const result = await Product.updateOne(
      { _id: line.productId, isActive: true, quantity: { $gte: line.quantity } },
      { $inc: { quantity: -line.quantity } }
    );
    if (result.modifiedCount === 0) {
      await adjustStock(reserved, 1);
      throw new ApiError(409, `Insufficient stock for ${line.name}`);
    }
    reserved.push(line);
  }
};

const buildLines = async (items) => {
  const ids = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const byId = new Map(products.map((product) => [String(product._id), product]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new ApiError(404, 'One or more products are no longer available');
    if (item.size && product.sizes.length && !product.sizes.includes(item.size)) {
      throw new ApiError(400, `Size ${item.size} is not available for ${product.name}`);
    }
    return {
      productId: String(product._id),
      name: product.name,
      price: product.effectivePrice,
      quantity: item.quantity,
      image: product.images[0],
      size: item.size,
    };
  });
};

const createOrder = async ({ userId, items, deliveryDetails, payment, ipAddress }) => {
  const lines = await buildLines(items);
  await reserveStock(lines);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = subtotal + DELIVERY_FEE;
  const isDigital = payment.method !== 'cash_on_delivery';

  try {
    const order = await Order.create({
      userId,
      items: lines,
      deliveryDetails,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      discount: 0,
      total,
      payment: { ...payment, status: isDigital ? 'awaiting_verification' : 'pending', amount: total },
      status: 'Pending',
      statusHistory: [{ status: 'Pending', changedBy: 'system', note: 'Order created' }],
      ipAddress,
    });
    await notifyUser(userId, order._id, `Your order ${order.orderNumber} has been placed successfully.`);
    return order;
  } catch (error) {
    await adjustStock(lines, 1);
    throw error;
  }
};

const closeOrder = async (order, { status, changedBy, note }) => {
  const shouldRestock = !order.stockRestored && RESTOCK_FROM_STATUSES.includes(order.status);
  order.cancellationReason = note;
  order.setStatus(status, changedBy, note);
  if (shouldRestock) {
    await adjustStock(order.items, 1);
    order.stockRestored = true;
  }
  await order.save();
  await notifyUser(order.userId, order._id, `Your order ${order.orderNumber} is now ${status}.`);
  return order;
};

module.exports = { createOrder, closeOrder };
