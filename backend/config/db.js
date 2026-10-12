const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

let connection = null;

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connection) {
    connection = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 })
      .then(() => {
        console.log('MongoDB connected successfully');
        return mongoose.connection;
      })
      .catch((error) => {
        connection = null;
        throw error;
      });
  }
  return connection;
};

module.exports = { connectDatabase };
