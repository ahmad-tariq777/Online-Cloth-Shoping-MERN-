const ApiError = require('./ApiError');
const { GENDERS } = require('./constants');
const { isObjectId } = require('./validators');

const parseBool = (value, fallback) => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return fallback;
};

const parseJson = (raw, fallback = null) => {
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const parseList = (raw) => {
  const parsed = parseJson(raw, null);
  let list = [];
  if (Array.isArray(parsed)) list = parsed;
  else if (typeof raw === 'string') list = raw.split(',');
  return list.map((item) => String(item).trim()).filter(Boolean);
};

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
};

const pickDefined = (source, keys) =>
  Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));

const parseLinkedProducts = (raw) => {
  if (raw === undefined) return undefined;
  if (raw === '') return [];
  const parsed = parseJson(raw, undefined);
  if (!Array.isArray(parsed)) throw new ApiError(400, 'Invalid linkedProducts format');
  return parsed
    .filter((item) => item && isObjectId(String(item.product)))
    .map((item) => ({
      product: String(item.product),
      gender: GENDERS.includes(item.gender) ? item.gender : 'unisex',
    }));
};

module.exports = { parseBool, parseJson, parseList, toNumber, pickDefined, parseLinkedProducts };
