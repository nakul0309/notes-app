const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const authResponse = (user) => ({ user, token: signToken(user.id) });

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) {
    throw new ApiError(409, 'Email is already registered', 'DUPLICATE');
  }
  const user = await User.create({ name, email, password });
  res.status(201).json(authResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  res.json(authResponse(user));
});

const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getCurrentUser };
