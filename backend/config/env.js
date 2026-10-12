require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const list = (value, fallback) =>
  (value || fallback)
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  clientUrls: list(process.env.CLIENT_URL, 'http://localhost:3000'),
};
