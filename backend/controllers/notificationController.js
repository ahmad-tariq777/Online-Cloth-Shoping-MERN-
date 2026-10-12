const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { getPagination, pageMeta } = require('../utils/pagination');
const { isObjectId } = require('../utils/validators');
const { parseBool } = require('../utils/parse');

const createNotification = async (req, res) => {
  const { userId, orderId, message } = req.body;

  if (!isObjectId(String(userId))) throw new ApiError(400, 'A valid userId is required');
  if (orderId && !isObjectId(String(orderId))) throw new ApiError(400, 'Invalid orderId');
  if (typeof message !== 'string' || !message.trim()) throw new ApiError(400, 'Message is required');
  if (!(await User.exists({ _id: userId }))) throw new ApiError(404, 'User not found');

  const notification = await Notification.create({ userId, orderId: orderId || undefined, message: message.trim() });
  res.status(201).json(notification);
};

const listMyNotifications = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const filter = { userId: req.user.userId };
  if (parseBool(req.query.unread, false)) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user.userId, read: false }),
  ]);

  res.status(200).json({ notifications, unreadCount, ...pageMeta(total, page, limit) });
};

const markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.status(200).json(notification);
};

const markAllRead = async (req, res) => {
  const result = await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
  res.status(200).json({ message: 'All notifications marked as read', updated: result.modifiedCount });
};

module.exports = { createNotification, listMyNotifications, markRead, markAllRead };
