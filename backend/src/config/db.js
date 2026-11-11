const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;
