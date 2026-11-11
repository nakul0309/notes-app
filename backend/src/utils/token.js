const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const signToken = (userId) =>
  jwt.sign({ sub: userId }, jwtSecret, { expiresIn: jwtExpiresIn });

module.exports = { signToken };
