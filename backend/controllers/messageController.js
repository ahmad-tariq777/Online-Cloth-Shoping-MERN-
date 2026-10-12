const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { isObjectId } = require('../utils/validators');

const ADMIN = 'admin';

const sendMessage = async (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) throw new ApiError(400, 'Message text is required');
  if (text.length > 2000) throw new ApiError(400, 'Message is too long');

  const staff = isStaff(req.user);
  let receiver = ADMIN;

  if (staff) {
    receiver = String(req.body.receiver || '');
    if (!isObjectId(receiver)) throw new ApiError(400, 'A valid receiver is required');
  }

  const orderId = isObjectId(String(req.body.orderId)) ? String(req.body.orderId) : undefined;
  const message = await Message.create({
    sender: staff ? ADMIN : req.user.userId,
    receiver,
    text,
    orderId,
  });

  res.status(201).json({ message: 'Message sent', data: message });
};

const getConversation = async (req, res) => {
  const { userId } = req.params;
  const staff = isStaff(req.user);
  if (!staff && userId !== req.user.userId) throw new ApiError(403, 'You can only view your own messages');

  const thread = { $or: [{ sender: userId, receiver: ADMIN }, { sender: ADMIN, receiver: userId }] };
  const messages = await Message.find(thread).sort({ timestamp: 1 });

  const unreadFilter = staff
    ? { sender: userId, receiver: ADMIN, read: false }
    : { sender: ADMIN, receiver: userId, read: false };
  await Message.updateMany(unreadFilter, { read: true });

  res.json(messages);
};

const listConversations = async (req, res) => {
  const conversations = await Message.aggregate([
    { $addFields: { userId: { $cond: [{ $eq: ['$sender', ADMIN] }, '$receiver', '$sender'] } } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$userId',
        lastMessage: { $first: '$text' },
        lastMessageAt: { $first: '$timestamp' },
        unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', ADMIN] }, { $eq: ['$read', false] }] }, 1, 0] } },
      },
    },
    { $sort: { lastMessageAt: -1 } },
    { $project: { _id: 0, userId: '$_id', lastMessage: 1, lastMessageAt: 1, unreadCount: 1 } },
  ]);

  res.json(conversations);
};

module.exports = { sendMessage, getConversation, listConversations };
