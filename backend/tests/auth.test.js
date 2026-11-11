const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const {
  app,
  request,
  setupDatabase,
  teardownDatabase,
  registerUser,
  bearer,
} = require('./helpers');
const User = require('../src/models/User');

describe('Authentication', () => {
  before(setupDatabase);
  after(teardownDatabase);

  describe('POST /api/auth/register', () => {
    it('registers a user and returns a token without the password', async () => {
      const { res, payload } = await registerUser({ email: 'Alice@Example.com' });
      assert.equal(res.status, 201);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, 'alice@example.com');
      assert.equal(res.body.user.name, payload.name);
      assert.equal(res.body.user.password, undefined);
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      const { payload } = await registerUser();
      const stored = await User.findOne({ email: payload.email }).select('+password');
      assert.notEqual(stored.password, payload.password);
      assert.match(stored.password, /^\$2[aby]\$/);
    });

    it('rejects a duplicate email (case-insensitive)', async () => {
      await registerUser({ email: 'dupe@example.com' });
      const { res } = await registerUser({ email: 'DUPE@example.com' });
      assert.equal(res.status, 409);
    });

    it('rejects invalid input', async () => {
      const cases = [
        { name: '', email: 'a@b.com', password: 'Passw0rd123' },
        { name: 'Bob', email: 'not-an-email', password: 'Passw0rd123' },
        { name: 'Bob', email: 'bob@example.com', password: 'short1' },
        { name: 'Bob', email: 'bob@example.com', password: 'onlyletters' },
        { name: 'Bob', email: 'bob@example.com', password: '12345678' },
        { name: 'Bob', email: 'bob@example.com' },
        {},
      ];
      for (const body of cases) {
        const res = await request(app).post('/api/auth/register').send(body);
        assert.equal(res.status, 400, JSON.stringify(body));
        assert.equal(res.body.code, 'VALIDATION_ERROR');
      }
    });

    it('rejects malformed JSON', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{bad json');
      assert.equal(res.status, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const { payload } = await registerUser();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: payload.email, password: payload.password });
      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.password, undefined);
    });

    it('rejects a wrong password and unknown email with the same message', async () => {
      const { payload } = await registerUser();
      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: payload.email, password: 'WrongPass1' });
      const unknownEmail = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'Passw0rd123' });
      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.equal(wrongPassword.body.message, unknownEmail.body.message);
    });

    it('rejects invalid input', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'bad' });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const { token, user } = await registerUser();
      const res = await request(app).get('/api/auth/me').set(bearer(token));
      assert.equal(res.status, 200);
      assert.equal(res.body.user.id ?? res.body.user._id, user.id ?? user._id);
      assert.equal(res.body.user.password, undefined);
    });

    it('rejects a missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'NO_TOKEN');
    });

    it('rejects a malformed token', async () => {
      const res = await request(app).get('/api/auth/me').set(bearer('garbage'));
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'INVALID_TOKEN');
    });

    it('rejects a token signed with a different secret', async () => {
      const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, 'other-secret');
      const res = await request(app).get('/api/auth/me').set(bearer(forged));
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'INVALID_TOKEN');
    });

    it('reports an expired token distinctly', async () => {
      const { user } = await registerUser();
      const expired = jwt.sign({ sub: user.id ?? user._id }, 'test-secret', { expiresIn: -10 });
      const res = await request(app).get('/api/auth/me').set(bearer(expired));
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'TOKEN_EXPIRED');
    });

    it('rejects a valid token whose user was deleted', async () => {
      const { token, user } = await registerUser();
      await User.findByIdAndDelete(user.id ?? user._id);
      const res = await request(app).get('/api/auth/me').set(bearer(token));
      assert.equal(res.status, 401);
    });
  });
});
