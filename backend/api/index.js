const app = require('../app');
const { connectDatabase } = require('../config/db');
const { ensureSuperAdmin } = require('../services/bootstrapService');

let ready = null;

const initialise = async () => {
  await connectDatabase();
  await ensureSuperAdmin();
};

module.exports = async (req, res) => {
  try {
    if (!ready) ready = initialise();
    await ready;
  } catch (error) {
    ready = null;
    console.error('Initialisation failed:', error);
    return res.status(503).json({ message: 'Service temporarily unavailable' });
  }
  return app(req, res);
};
