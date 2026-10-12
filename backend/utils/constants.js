const GENDERS = ['men', 'women', 'kids_male', 'kids_female', 'unisex'];
const PRODUCT_SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all_season', ''];
const COLLECTION_SEASONS = ['winter', 'summer', 'spring', 'autumn', 'none'];

const ROLES = { CUSTOMER: 'customer', MODERATOR: 'moderator', SUPER_ADMIN: 'super_admin' };

const ORDER_STATUSES = [
  'Pending', 'In Process', 'Confirmed', 'Shipped', 'Delivered', 'Rejected', 'Cancelled', 'Refund Requested',
];

const ORDER_TRANSITIONS = {
  Pending: ['In Process', 'Rejected', 'Cancelled'],
  'In Process': ['Confirmed', 'Rejected', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: ['Refund Requested'],
  Rejected: [],
  Cancelled: [],
  'Refund Requested': ['Cancelled'],
};

const RESTOCK_FROM_STATUSES = ['Pending', 'In Process', 'Confirmed'];
const PAYMENT_METHODS = ['cash_on_delivery', 'easypaisa', 'jazzcash'];
const DIGITAL_PAYMENT_METHODS = ['easypaisa', 'jazzcash'];
const PAYMENT_STATUSES = ['pending', 'awaiting_verification', 'verified', 'failed', 'refunded'];
const DELIVERY_FEE = 150;

module.exports = {
  GENDERS,
  PRODUCT_SEASONS,
  COLLECTION_SEASONS,
  ROLES,
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  RESTOCK_FROM_STATUSES,
  PAYMENT_METHODS,
  DIGITAL_PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DELIVERY_FEE,
};
