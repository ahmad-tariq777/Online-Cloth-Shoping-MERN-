const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const PHONE_REGEX = /^(\+92|0)?[0-9]{10}$/;
const POSTAL_CODE_REGEX = /^[0-9]{5}$/;

const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character';

const isObjectId = (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value);
const isEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value);
const isStrongPassword = (value) => typeof value === 'string' && PASSWORD_REGEX.test(value);

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  POSTAL_CODE_REGEX,
  PASSWORD_RULE_MESSAGE,
  isObjectId,
  isEmail,
  isStrongPassword,
};
