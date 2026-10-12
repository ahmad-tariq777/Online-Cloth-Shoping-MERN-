const express = require('express');
const mongoose = require('mongoose');
const Image = require('../models/Image');
const ApiError = require('../utils/ApiError');

const router = express.Router();

router.get('/:file', async (req, res, next) => {
  try {
    const id = req.params.file.split('.')[0];
    if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Image not found');
    const image = await Image.findById(id);
    if (!image) throw new ApiError(404, 'Image not found');
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(image.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
