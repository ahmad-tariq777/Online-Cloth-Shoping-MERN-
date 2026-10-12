const mongoose = require('mongoose');
const env = require('./config/env');
const app = require('./app');
const { connectDatabase } = require('./config/db');
const { ensureSuperAdmin } = require('./services/bootstrapService');

let server;

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.close();
  process.exit(0);
};

const start = async () => {
  try {
    await connectDatabase();
    await ensureSuperAdmin();
    server = app.listen(env.port, () => console.log(`Server running at http://localhost:${env.port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

start();
