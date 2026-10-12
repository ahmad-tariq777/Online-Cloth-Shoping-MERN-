const CarouselSlide = require('../models/CarouselSlide');
const ApiError = require('../utils/ApiError');
const { COLLECTION_SEASONS } = require('../utils/constants');
const { toPublicPath, removeFiles } = require('../utils/files');
const { parseBool, toNumber, pickDefined, parseLinkedProducts } = require('../utils/parse');
const { isStaff } = require('../middleware/auth');

const PRODUCT_FIELDS = 'name price images gender category';
const TEXT_FIELDS = ['label', 'heading', 'subheading', 'body', 'scrollLabel', 'issue', 'index', 'collectionName'];

const withProducts = (query) => query.populate('linkedProducts.product', PRODUCT_FIELDS);

const buildPayload = (body) => {
  const payload = pickDefined(body, TEXT_FIELDS);
  if (body.order !== undefined) payload.order = toNumber(body.order, 0);
  if (body.active !== undefined) payload.active = parseBool(body.active, true);
  if (body.season !== undefined) payload.season = COLLECTION_SEASONS.includes(body.season) ? body.season : 'none';
  const linkedProducts = parseLinkedProducts(body.linkedProducts);
  if (linkedProducts !== undefined) payload.linkedProducts = linkedProducts;
  return payload;
};

const listActive = async (req, res) => {
  res.json(await withProducts(CarouselSlide.find({ active: true }).sort({ order: 1 })));
};

const listAll = async (req, res) => {
  res.json(await withProducts(CarouselSlide.find().sort({ order: 1 })));
};

const getSlide = async (req, res) => {
  const slide = await withProducts(CarouselSlide.findById(req.params.id));
  if (!slide || (!slide.active && !isStaff(req.user))) throw new ApiError(404, 'Slide not found');
  res.json(slide);
};

const createSlide = async (req, res) => {
  const slide = new CarouselSlide({
    ...buildPayload(req.body),
    image: req.file ? toPublicPath(req.file) : null,
  });
  await slide.save();
  res.status(201).json(await withProducts(CarouselSlide.findById(slide._id)));
};

const updateSlide = async (req, res) => {
  const slide = await CarouselSlide.findById(req.params.id);
  if (!slide) throw new ApiError(404, 'Slide not found');

  const previousImage = slide.image;
  slide.set(buildPayload(req.body));
  if (req.file) slide.image = toPublicPath(req.file);

  await slide.save();
  if (req.file) await removeFiles(previousImage);

  res.json(await withProducts(CarouselSlide.findById(slide._id)));
};

const deleteSlide = async (req, res) => {
  const slide = await CarouselSlide.findById(req.params.id);
  if (!slide) throw new ApiError(404, 'Slide not found');

  await slide.deleteOne();
  await removeFiles(slide.image);
  res.json({ message: 'Slide deleted successfully' });
};

module.exports = { listActive, listAll, getSlide, createSlide, updateSlide, deleteSlide };
