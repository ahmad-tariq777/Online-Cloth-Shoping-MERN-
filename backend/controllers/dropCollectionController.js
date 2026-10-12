const DropCollection = require('../models/DropCollection');
const ApiError = require('../utils/ApiError');
const { COLLECTION_SEASONS } = require('../utils/constants');
const { toPublicPath, removeFiles } = require('../utils/files');
const { parseBool, toNumber, pickDefined, parseLinkedProducts } = require('../utils/parse');
const { isStaff } = require('../middleware/auth');

const PRODUCT_FIELDS = 'name price images category gender brand';
const TEXT_FIELDS = ['heading', 'subheading', 'body'];

const withProducts = (query) => query.populate('linkedProducts.product', PRODUCT_FIELDS);

const buildPayload = (body) => {
  const payload = pickDefined(body, TEXT_FIELDS);
  if (typeof body.collectionName === 'string' && body.collectionName.trim()) {
    payload.collectionName = body.collectionName.trim();
  }
  if (body.order !== undefined) payload.order = toNumber(body.order, 0);
  if (body.active !== undefined) payload.active = parseBool(body.active, true);
  if (body.season !== undefined) payload.season = COLLECTION_SEASONS.includes(body.season) ? body.season : 'none';
  const linkedProducts = parseLinkedProducts(body.linkedProducts);
  if (linkedProducts !== undefined) payload.linkedProducts = linkedProducts;
  return payload;
};

const listActive = async (req, res) => {
  res.status(200).json(await withProducts(DropCollection.find({ active: true }).sort({ order: 1 })));
};

const listAll = async (req, res) => {
  res.status(200).json(await withProducts(DropCollection.find().sort({ order: 1 })));
};

const getCollection = async (req, res) => {
  const collection = await withProducts(DropCollection.findById(req.params.id));
  if (!collection || (!collection.active && !isStaff(req.user))) throw new ApiError(404, 'Collection not found');
  res.status(200).json(collection);
};

const createCollection = async (req, res) => {
  const payload = buildPayload(req.body);
  if (!payload.collectionName) throw new ApiError(400, 'Collection name is required');

  const collection = new DropCollection({ ...payload, image: req.file ? toPublicPath(req.file) : null });
  await collection.save();
  await collection.populate('linkedProducts.product', PRODUCT_FIELDS);

  res.status(201).json({ message: 'Collection created successfully', collection });
};

const updateCollection = async (req, res) => {
  const collection = await DropCollection.findById(req.params.id);
  if (!collection) throw new ApiError(404, 'Collection not found');

  const previousImage = collection.image;
  collection.set(buildPayload(req.body));
  if (req.file) collection.image = toPublicPath(req.file);

  await collection.save();
  if (req.file) await removeFiles(previousImage);
  await collection.populate('linkedProducts.product', PRODUCT_FIELDS);

  res.status(200).json({ message: 'Collection updated successfully', collection });
};

const deleteCollection = async (req, res) => {
  const collection = await DropCollection.findById(req.params.id);
  if (!collection) throw new ApiError(404, 'Collection not found');

  await collection.deleteOne();
  await removeFiles(collection.image);
  res.status(200).json({ message: 'Collection deleted successfully' });
};

module.exports = { listActive, listAll, getCollection, createCollection, updateCollection, deleteCollection };
