const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { GENDERS, PRODUCT_SEASONS } = require('../utils/constants');
const { toPublicPath, removeFiles } = require('../utils/files');
const { getPagination, pageMeta } = require('../utils/pagination');
const { parseBool, parseList, toNumber } = require('../utils/parse');
const { parseSizeChart, parseColors } = require('../utils/productParsers');
const { exactMatch, containsMatch } = require('../utils/text');

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { averageRating: -1, reviewCount: -1 },
};

const isMissing = (value) => value === undefined || value === null || String(value).trim() === '';

const requirePositive = (value, label) => {
  const number = Number(value);
  if (Number.isNaN(number) || number <= 0) throw new ApiError(400, `${label} must be a positive number`);
  return number;
};

const requireNonNegative = (value, label) => {
  const number = Number(value);
  if (Number.isNaN(number) || number < 0) throw new ApiError(400, `${label} must be a non-negative number`);
  return number;
};

const buildFilter = (query) => {
  const { category, subCategory, gender, season, brand, search, minPrice, maxPrice, inStock, onSale } = query;
  const filter = { isActive: true };

  if (category) filter.category = exactMatch(category);
  if (subCategory) filter.subCategory = exactMatch(subCategory);
  if (brand) filter.brand = exactMatch(brand);
  if (GENDERS.includes(gender)) filter.gender = gender;
  if (PRODUCT_SEASONS.includes(season) && season) filter.season = season;
  if (parseBool(inStock, false)) filter.quantity = { $gt: 0 };

  const min = toNumber(minPrice);
  const max = toNumber(maxPrice);
  if (min !== undefined || max !== undefined) {
    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  if (search) {
    const pattern = containsMatch(search);
    filter.$or = [{ name: pattern }, { brand: pattern }, { tags: pattern }];
  }

  if (parseBool(onSale, false)) {
    const now = new Date();
    filter.saleActive = true;
    filter.salePrice = { $gt: 0 };
    filter.$and = [
      { $or: [{ saleStartDate: { $exists: false } }, { saleStartDate: null }, { saleStartDate: { $lte: now } }] },
      { $or: [{ saleEndDate: { $exists: false } }, { saleEndDate: null }, { saleEndDate: { $gte: now } }] },
    ];
  }

  return filter;
};

const listProducts = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildFilter(req.query);
  const sort = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({ products, ...pageMeta(total, page, limit) });
};

const listSubCategories = async (req, res) => {
  const filter = { isActive: true, subCategory: { $ne: '' } };
  if (req.query.category) filter.category = exactMatch(req.query.category);
  const subCategories = await Product.distinct('subCategory', filter);
  res.status(200).json({ subCategories: subCategories.filter(Boolean) });
};

const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.status(200).json(product);
};

const createProduct = async (req, res) => {
  const { name, description, price, category, subCategory, quantity, sizes, sizeChart, gender, colors, season, tags, brand, material } = req.body;

  if ([name, description, price, category, quantity].some(isMissing)) {
    throw new ApiError(400, 'Name, description, price, category and quantity are required');
  }

  const product = await Product.create({
    name: String(name).trim(),
    description: String(description).trim(),
    price: requirePositive(price, 'Price'),
    category: String(category).trim(),
    subCategory: subCategory ? String(subCategory).trim() : '',
    quantity: requireNonNegative(quantity, 'Quantity'),
    gender: GENDERS.includes(gender) ? gender : 'unisex',
    season: PRODUCT_SEASONS.includes(season) ? season : '',
    images: (req.files || []).map((file) => toPublicPath(file, true)),
    sizes: parseList(sizes),
    sizeChart: parseSizeChart(sizeChart),
    colors: parseColors(colors),
    tags: parseList(tags),
    brand: brand ? String(brand).trim() : '',
    material: material ? String(material).trim() : '',
  });

  res.status(201).json({ message: 'Product created successfully', product });
};

const updateProduct = async (req, res) => {
  const { name, description, price, category, subCategory, quantity, sizes, sizeChart, gender, colors, season, tags, brand, material, isActive } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const previousImages = product.images;
  const updates = {};

  if (!isMissing(name)) updates.name = String(name).trim();
  if (!isMissing(description)) updates.description = String(description).trim();
  if (!isMissing(price)) updates.price = requirePositive(price, 'Price');
  if (!isMissing(category)) updates.category = String(category).trim();
  if (subCategory !== undefined) updates.subCategory = String(subCategory).trim();
  if (!isMissing(quantity)) updates.quantity = requireNonNegative(quantity, 'Quantity');
  if (GENDERS.includes(gender)) updates.gender = gender;
  if (season !== undefined && PRODUCT_SEASONS.includes(season)) updates.season = season;
  if (sizes !== undefined) updates.sizes = parseList(sizes);
  if (sizeChart !== undefined) updates.sizeChart = parseSizeChart(sizeChart);
  if (colors !== undefined) updates.colors = parseColors(colors);
  if (tags !== undefined) updates.tags = parseList(tags);
  if (brand !== undefined) updates.brand = String(brand).trim();
  if (material !== undefined) updates.material = String(material).trim();
  if (isActive !== undefined) updates.isActive = parseBool(isActive, product.isActive);

  const replacedImages = req.files && req.files.length > 0;
  if (replacedImages) updates.images = req.files.map((file) => toPublicPath(file, true));

  product.set(updates);
  await product.save();
  if (replacedImages) await removeFiles(previousImages);

  res.status(200).json({ message: 'Product updated successfully', product });
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await removeFiles(product.images);
  res.status(200).json({ message: 'Product deleted successfully' });
};

module.exports = { listProducts, listSubCategories, getProduct, createProduct, updateProduct, deleteProduct };
