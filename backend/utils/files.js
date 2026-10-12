const mongoose = require('mongoose');
const Image = require('../models/Image');

const toPublicPath = (file, leadingSlash = false) =>
  leadingSlash ? `/${file.publicPath}` : file.publicPath;

const imageId = (value) => {
  const match = String(value || '').match(/uploads\/([a-f0-9]{24})/i);
  return match && mongoose.isValidObjectId(match[1]) ? match[1] : null;
};

const removeFiles = async (paths) => {
  const ids = (Array.isArray(paths) ? paths : [paths]).map(imageId).filter(Boolean);
  if (ids.length) await Image.deleteMany({ _id: { $in: ids } }).catch(() => {});
};

const uploadedFiles = (req) => [...(req.file ? [req.file] : []), ...(Array.isArray(req.files) ? req.files : [])];

const removeRequestUploads = async (req) => {
  await removeFiles(uploadedFiles(req).map((file) => file.publicPath));
};

module.exports = { toPublicPath, removeFiles, removeRequestUploads, uploadedFiles };
