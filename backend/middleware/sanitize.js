const strip = (value) => {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) delete value[key];
    else strip(value[key]);
  }
};

const sanitizeInput = (req, res, next) => {
  strip(req.body);
  strip(req.params);
  next();
};

module.exports = { sanitizeInput };
