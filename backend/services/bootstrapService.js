const User = require('../models/User');
const superAdmin = require('../config/superAdmin');
const { ROLES } = require('../utils/constants');
const { normalizeEmail } = require('../utils/text');

const ensureSuperAdmin = async () => {
  const email = normalizeEmail(superAdmin.email);
  if (await User.exists({ email })) return;

  await User.create({
    fullName: superAdmin.fullName,
    email,
    password: await User.hashPassword(superAdmin.password),
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });
  console.log('Super Admin created successfully');
};

module.exports = { ensureSuperAdmin };
