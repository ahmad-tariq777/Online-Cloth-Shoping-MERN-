const Notification = require('../models/Notification');
const { isObjectId } = require('../utils/validators');

const notifyUser = async (userId, orderId, message) => {
  if (!isObjectId(String(userId))) return;
  try {
    await Notification.create({ userId, orderId, message });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

module.exports = { notifyUser };
