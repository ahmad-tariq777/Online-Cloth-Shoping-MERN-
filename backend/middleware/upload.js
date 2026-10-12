const path = require('path');
const multer = require('multer');
const Image = require('../models/Image');
const ApiError = require('../utils/ApiError');
const { uploadedFiles } = require('../utils/files');

const IMAGE_PATTERN = /jpeg|jpg|png|gif|webp/;
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const persistUploads = async (req, res, next) => {
  try {
    for (const file of uploadedFiles(req)) {
      const extension = path.extname(file.originalname).toLowerCase();
      const image = await Image.create({
        data: file.buffer,
        contentType: file.mimetype,
        size: file.size,
      });
      file.publicPath = `uploads/${image._id}${extension}`;
      file.buffer = undefined;
    }
    next();
  } catch (error) {
    next(error);
  }
};

const createUpload = ({ maxFileSize = MAX_FILE_SIZE } = {}) => {
  const fileFilter = (req, file, cb) => {
    const validExtension = IMAGE_PATTERN.test(path.extname(file.originalname).toLowerCase());
    const validMime = IMAGE_PATTERN.test(file.mimetype);
    if (validExtension && validMime) return cb(null, true);
    cb(new ApiError(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  };

  const parser = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: Math.min(maxFileSize, MAX_FILE_SIZE) },
  });

  return {
    single: (field) => [parser.single(field), persistUploads],
    array: (field, max) => [parser.array(field, max), persistUploads],
  };
};

module.exports = { createUpload };
