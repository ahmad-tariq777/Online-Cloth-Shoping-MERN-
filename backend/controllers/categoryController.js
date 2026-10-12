const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { exactMatch } = require('../utils/text');
const { parseBool } = require('../utils/parse');

const findCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
};

const listCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json(categories);
};

const getCategory = async (req, res) => {
  res.status(200).json(await findCategory(req.params.id));
};

const createCategory = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) throw new ApiError(400, 'Category name is required');

  const existing = await Category.findOne({ name: exactMatch(name) });
  if (existing) return res.status(409).json({ message: 'Category already exists', category: existing });

  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const category = await Category.create({ name, description });
  res.status(201).json({ message: 'Category created successfully', category });
};

const updateCategory = async (req, res) => {
  const category = await findCategory(req.params.id);
  const { name, description, isActive } = req.body;
  const previousName = category.name;

  if (typeof name === 'string' && name.trim()) {
    const duplicate = await Category.findOne({ name: exactMatch(name), _id: { $ne: category._id } });
    if (duplicate) throw new ApiError(409, 'Another category with that name already exists');
    category.name = name.trim();
  }
  if (typeof description === 'string') category.description = description.trim();
  if (isActive !== undefined) category.isActive = parseBool(isActive, category.isActive);

  await category.save();

  if (category.name !== previousName) {
    await Product.updateMany({ category: exactMatch(previousName) }, { category: category.name });
  }

  res.status(200).json({ message: 'Category updated successfully', category });
};

const deleteCategory = async (req, res) => {
  const category = await findCategory(req.params.id);

  const inUse = await Product.countDocuments({ category: exactMatch(category.name) });
  if (inUse > 0) {
    throw new ApiError(409, `Cannot delete a category used by ${inUse} product(s). Deactivate it instead.`);
  }

  await category.deleteOne();
  res.status(200).json({ message: 'Category deleted successfully' });
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
