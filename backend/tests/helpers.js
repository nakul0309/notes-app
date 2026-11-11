process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/notes_app_test';

const mongoose = require('mongoose');
const request = require('supertest');
const connectDB = require('../src/config/db');
const app = require('../src/app');

const setupDatabase = async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await mongoose.syncIndexes();
};

const teardownDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

const registerUser = async (overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random().toString(16).slice(2)}@example.com`,
    password: 'Passw0rd123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { payload, token: res.body.token, user: res.body.user, res };
};

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, request, setupDatabase, teardownDatabase, registerUser, bearer };
