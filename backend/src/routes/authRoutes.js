const express = require('express');
const rateLimit = require('express-rate-limit');
const { nodeEnv } = require('../config/env');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { register, login, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => nodeEnv === 'test',
  message: { message: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getCurrentUser);

module.exports = router;
