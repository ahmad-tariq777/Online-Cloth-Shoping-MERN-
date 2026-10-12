const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { ORDER_STATUSES, ORDER_TRANSITIONS } = require('../utils/constants');
const { getPagination, pageMeta } = require('../utils/pagination');
const { parseBool } = require('../utils/parse');
const { containsMatch } = require('../utils/text');
const { createOrder, closeOrder } = require('../services/orderService');
const { notifyUser } = require('../services/notificationService');
const { isStaff } = require('../middleware/auth');

const USER_HIDDEN_FIELDS = '-ipAddress -adminNotes -__v';
const TERMINAL_STATUSES = ['Rejected', 'Cancelled'];

const findOrder = async (id) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

const findOwnOrder = async (id, userId) => {
  const order = await findOrder(id);
  if (order.userId !== userId) throw new ApiError(404, 'Order not found');
  return order;
};

const summarize = (order) => ({
  _id: order._id,
  orderNumber: order.orderNumber,
  status: order.status,
  statusHistory: order.statusHistory,
  trackingNumber: order.trackingNumber,
  estimatedDelivery: order.estimatedDelivery,
});

const placeOrder = async (req, res) => {
  const { items, deliveryDetails, payment } = req.body;
  const order = await createOrder({
    userId: req.user.userId,
    items,
    deliveryDetails,
    payment,
    ipAddress: req.ip,
  });

  res.status(201).json({
    message: 'Order placed successfully',
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
      createdAt: order.createdAt,
    },
  });
};

const listUserOrders = async (userId, query, res) => {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 10, maxLimit: 50 });
  const filter = { userId, isDeleted: false };
  if (ORDER_STATUSES.includes(query.status)) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).select(`${USER_HIDDEN_FIELDS} -statusHistory`).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({ orders, ...pageMeta(total, page, limit), totalPages: Math.ceil(total / limit) });
};

const listMyOrders = (req, res) => listUserOrders(req.user.userId, req.query, res);

const listOrdersForUser = (req, res) => {
  if (req.params.userId !== req.user.userId && !isStaff(req.user)) {
    throw new ApiError(403, 'You can only view your own orders');
  }
  return listUserOrders(req.params.userId, req.query, res);
};

const getOrder = async (req, res) => {
  const order = await findOrder(req.params.id);
  if (order.userId !== req.user.userId && !isStaff(req.user)) throw new ApiError(404, 'Order not found');

  const data = order.toObject();
  delete data.__v;
  if (!isStaff(req.user)) {
    delete data.ipAddress;
    delete data.adminNotes;
  }
  res.status(200).json(data);
};

const listAllOrders = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const { status, paymentMethod, search } = req.query;
  const filter = { isDeleted: false };

  if (ORDER_STATUSES.includes(status)) filter.status = status;
  if (paymentMethod) filter['payment.method'] = String(paymentMethod);
  if (search) {
    const pattern = containsMatch(search);
    filter.$or = [
      { orderNumber: pattern },
      { userId: String(search).trim() },
      { 'deliveryDetails.fullName': pattern },
      { 'deliveryDetails.phoneNumber': pattern },
    ];
  }

  const [orders, total, stats] = await Promise.all([
    Order.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
  ]);

  res.json({ orders, ...pageMeta(total, page, limit), stats });
};

const updateStatus = async (req, res) => {
  const { status, adminNotes, trackingNumber, estimatedDelivery } = req.body;

  if (!ORDER_STATUSES.includes(status) || status === 'Refund Requested') {
    throw new ApiError(400, 'Invalid status value');
  }

  const order = await findOrder(req.params.id);
  if (!ORDER_TRANSITIONS[order.status].includes(status)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${status}`);
  }
  if (status === 'Confirmed' && order.payment.method !== 'cash_on_delivery' && order.payment.status !== 'verified') {
    throw new ApiError(400, 'Payment must be verified before confirming this order');
  }

  let deliveryDate;
  if (estimatedDelivery) {
    deliveryDate = new Date(estimatedDelivery);
    if (Number.isNaN(deliveryDate.getTime())) throw new ApiError(400, 'Invalid estimatedDelivery date');
  }

  const note = typeof adminNotes === 'string' ? adminNotes.slice(0, 1000) : undefined;
  if (note) order.adminNotes = note;
  if (typeof trackingNumber === 'string' && trackingNumber.trim()) order.trackingNumber = trackingNumber.trim().slice(0, 100);
  if (deliveryDate) order.estimatedDelivery = deliveryDate;

  if (TERMINAL_STATUSES.includes(status)) {
    await closeOrder(order, { status, changedBy: req.user.userId, note });
  } else {
    if (status === 'Delivered' && order.payment.method === 'cash_on_delivery') {
      order.payment.status = 'verified';
      order.payment.verifiedAt = new Date();
    }
    order.setStatus(status, req.user.userId, note);
    await order.save();
    await notifyUser(order.userId, order._id, `Your order ${order.orderNumber} is now ${status}.`);
  }

  res.status(200).json({ message: `Order status updated to ${status}`, order: summarize(order) });
};

const verifyPayment = async (req, res) => {
  const verified = parseBool(req.body.verified, false);
  const reason = typeof req.body.rejectionReason === 'string' ? req.body.rejectionReason.trim().slice(0, 300) : '';

  const order = await findOrder(req.params.id);
  if (order.payment.method === 'cash_on_delivery') {
    throw new ApiError(400, 'COD orders do not require payment verification');
  }
  if (TERMINAL_STATUSES.includes(order.status)) {
    throw new ApiError(400, `Cannot verify payment for a ${order.status.toLowerCase()} order`);
  }

  if (verified) {
    order.payment.status = 'verified';
    order.payment.verifiedAt = new Date();
    order.payment.verifiedBy = req.user.userId;
    await order.save();
    await notifyUser(order.userId, order._id, `Payment for order ${order.orderNumber} has been verified.`);
  } else {
    order.payment.status = 'failed';
    order.payment.notes = reason || 'Payment verification failed';
    await closeOrder(order, {
      status: 'Cancelled',
      changedBy: req.user.userId,
      note: `Payment not verified: ${reason || 'Invalid transaction'}`,
    });
  }

  res.status(200).json({ message: verified ? 'Payment verified' : 'Payment rejected', order });
};

const cancelMyOrder = async (req, res) => {
  const order = await findOwnOrder(req.params.id, req.user.userId);
  if (order.status !== 'Pending') throw new ApiError(400, 'Only pending orders can be cancelled');

  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
  await closeOrder(order, { status: 'Cancelled', changedBy: req.user.userId, note: reason || 'Cancelled by user' });

  res.status(200).json({ message: 'Order cancelled successfully' });
};

const requestRefund = async (req, res) => {
  const order = await findOwnOrder(req.params.id, req.user.userId);
  if (order.status !== 'Delivered') throw new ApiError(400, 'Refunds can only be requested for delivered orders');

  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
  if (!reason) throw new ApiError(400, 'A reason is required to request a refund');

  order.setStatus('Refund Requested', req.user.userId, reason);
  await order.save();

  res.status(200).json({ message: 'Refund requested successfully', order: summarize(order) });
};

module.exports = {
  placeOrder,
  listMyOrders,
  listOrdersForUser,
  getOrder,
  listAllOrders,
  updateStatus,
  verifyPayment,
  cancelMyOrder,
  requestRefund,
};
