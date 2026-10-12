const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { GENDERS } = require('../utils/constants');
const { getPagination, pageMeta } = require('../utils/pagination');
const { exactMatch, containsMatch } = require('../utils/text');
const { isObjectId } = require('../utils/validators');

const SALE_FIELDS = 'name price category subCategory gender images salePrice salePercent saleActive saleStartDate saleEndDate';

const parseDate = (value, label) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${label} is not a valid date`);
  return date;
};

const requireProductIds = (productIds) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, 'productIds must be a non-empty array');
  }
  const valid = productIds.filter((id) => isObjectId(String(id)));
  if (valid.length === 0) throw new ApiError(400, 'productIds contains no valid ids');
  return valid;
};

const listSaleProducts = async (req, res) => {
  const { category, subCategory, gender, search } = req.query;
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
  const filter = { isActive: true };

  if (category) filter.category = exactMatch(category);
  if (subCategory) filter.subCategory = exactMatch(subCategory);
  if (GENDERS.includes(gender)) filter.gender = gender;
  if (search) filter.name = containsMatch(search);

  const [products, total] = await Promise.all([
    Product.find(filter).select(SALE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({ products, ...pageMeta(total, page, limit) });
};

const getFilters = async (req, res) => {
  const { gender, category } = req.query;
  const genderFilter = GENDERS.includes(gender) ? { gender } : {};
  const subCategoryFilter = { isActive: true, ...genderFilter, subCategory: { $ne: '' } };
  if (category) subCategoryFilter.category = exactMatch(category);

  const [categories, subCategories] = await Promise.all([
    Product.distinct('category', { isActive: true, ...genderFilter }),
    Product.distinct('subCategory', subCategoryFilter),
  ]);

  res.status(200).json({ categories: categories.filter(Boolean), subCategories: subCategories.filter(Boolean) });
};

const calculateSale = (price, discountType, discountValue) => {
  if (discountType === 'percent') {
    return {
      salePercent: discountValue,
      salePrice: +(price * (1 - discountValue / 100)).toFixed(2),
    };
  }
  return {
    salePrice: Math.max(1, +(price - discountValue).toFixed(2)),
    salePercent: Math.min(100, +((discountValue / price) * 100).toFixed(1)),
  };
};

const applySale = async (req, res) => {
  const { discountType, startDate, endDate } = req.body;
  const productIds = requireProductIds(req.body.productIds);
  const discountValue = Number(req.body.discountValue);

  if (!['percent', 'flat'].includes(discountType)) {
    throw new ApiError(400, 'discountType must be "percent" or "flat"');
  }
  if (Number.isNaN(discountValue) || discountValue <= 0) {
    throw new ApiError(400, 'discountValue must be a positive number');
  }
  if (discountType === 'percent' && discountValue > 100) {
    throw new ApiError(400, 'Percent discount cannot exceed 100');
  }

  const start = parseDate(startDate, 'startDate') || new Date();
  const end = parseDate(endDate, 'endDate');
  if (end && end <= start) throw new ApiError(400, 'endDate must be after startDate');

  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).select('price');
  if (products.length === 0) throw new ApiError(404, 'No matching active products found');

  await Product.bulkWrite(
    products.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            ...calculateSale(product.price, discountType, discountValue),
            saleActive: true,
            saleStartDate: start,
            saleEndDate: end,
          },
        },
      },
    }))
  );

  res.status(200).json({
    message: `Sale applied to ${products.length} product(s)`,
    affectedCount: products.length,
  });
};

const removeSale = async (req, res) => {
  const productIds = requireProductIds(req.body.productIds);

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    {
      $unset: { salePrice: '', salePercent: '', saleStartDate: '', saleEndDate: '' },
      $set: { saleActive: false },
    }
  );

  res.status(200).json({
    message: `Sale removed from ${result.modifiedCount} product(s)`,
    affectedCount: result.modifiedCount,
  });
};

const listActiveSales = async (req, res) => {
  const now = new Date();
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    isActive: true,
    saleActive: true,
    salePrice: { $gt: 0 },
    $and: [
      { $or: [{ saleStartDate: { $exists: false } }, { saleStartDate: null }, { saleStartDate: { $lte: now } }] },
      { $or: [{ saleEndDate: { $exists: false } }, { saleEndDate: null }, { saleEndDate: { $gte: now } }] },
    ],
  };

  const [products, total] = await Promise.all([
    Product.find(filter).select(SALE_FIELDS).sort({ salePercent: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({ products, ...pageMeta(total, page, limit) });
};

module.exports = { listSaleProducts, getFilters, applySale, removeSale, listActiveSales };
