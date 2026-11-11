const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  app,
  request,
  setupDatabase,
  teardownDatabase,
  registerUser,
  bearer,
} = require('./helpers');
const Note = require('../src/models/Note');

const createNote = (token, body = { title: 'Groceries', content: 'Milk, eggs' }) =>
  request(app).post('/api/notes').set(bearer(token)).send(body);

describe('Notes', () => {
  let alice;
  let bob;

  before(async () => {
    await setupDatabase();
    alice = await registerUser();
    bob = await registerUser();
  });
  after(teardownDatabase);

  describe('CRUD', () => {
    it('creates a note owned by the authenticated user', async () => {
      const res = await createNote(alice.token);
      assert.equal(res.status, 201);
      assert.equal(res.body.note.title, 'Groceries');
      assert.equal(res.body.note.user, alice.user.id ?? alice.user._id);
      assert.ok(res.body.note.createdAt);
      assert.ok(res.body.note.updatedAt);
    });

    it('lists only the caller notes, newest update first', async () => {
      const carol = await registerUser();
      await createNote(carol.token, { title: 'First', content: '' });
      await createNote(carol.token, { title: 'Second', content: '' });
      const res = await request(app).get('/api/notes').set(bearer(carol.token));
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.notes.map((n) => n.title), ['Second', 'First']);
    });

    it('filters notes with the search query', async () => {
      const dave = await registerUser();
      await createNote(dave.token, { title: 'Recipe', content: 'pasta' });
      await createNote(dave.token, { title: 'Todo', content: 'call mom' });
      const res = await request(app).get('/api/notes?search=pasta').set(bearer(dave.token));
      assert.equal(res.body.notes.length, 1);
      assert.equal(res.body.notes[0].title, 'Recipe');
    });

    it('treats regex characters in search as plain text', async () => {
      const res = await request(app).get('/api/notes?search=.*').set(bearer(alice.token));
      assert.equal(res.status, 200);
      assert.equal(res.body.notes.length, 0);
    });

    it('reads a single note', async () => {
      const { body } = await createNote(alice.token, { title: 'Read me', content: 'x' });
      const res = await request(app).get(`/api/notes/${body.note._id}`).set(bearer(alice.token));
      assert.equal(res.status, 200);
      assert.equal(res.body.note.title, 'Read me');
    });

    it('updates a note and bumps updatedAt', async () => {
      const { body } = await createNote(alice.token, { title: 'Old', content: 'old' });
      await new Promise((resolve) => setTimeout(resolve, 15));
      const res = await request(app)
        .put(`/api/notes/${body.note._id}`)
        .set(bearer(alice.token))
        .send({ title: 'New', content: 'new' });
      assert.equal(res.status, 200);
      assert.equal(res.body.note.title, 'New');
      assert.equal(res.body.note.content, 'new');
      assert.ok(new Date(res.body.note.updatedAt) > new Date(body.note.updatedAt));
    });

    it('deletes a note', async () => {
      const { body } = await createNote(alice.token, { title: 'Temp', content: '' });
      const del = await request(app).delete(`/api/notes/${body.note._id}`).set(bearer(alice.token));
      assert.equal(del.status, 204);
      const get = await request(app).get(`/api/notes/${body.note._id}`).set(bearer(alice.token));
      assert.equal(get.status, 404);
    });

    it('returns 404 for a missing note', async () => {
      const res = await request(app)
        .get('/api/notes/507f1f77bcf86cd799439011')
        .set(bearer(alice.token));
      assert.equal(res.status, 404);
    });
  });

  describe('Invalid input', () => {
    it('rejects missing, blank, or oversized titles', async () => {
      const cases = [{}, { title: '' }, { title: '   ' }, { title: 'x'.repeat(121) }];
      for (const body of cases) {
        const res = await createNote(alice.token, body);
        assert.equal(res.status, 400, JSON.stringify(body).slice(0, 40));
      }
    });

    it('rejects oversized or non-string content', async () => {
      assert.equal((await createNote(alice.token, { title: 'a', content: 'x'.repeat(10001) })).status, 400);
      assert.equal((await createNote(alice.token, { title: 'a', content: 123 })).status, 400);
    });

    it('rejects an invalid note id on every id route', async () => {
      const get = await request(app).get('/api/notes/not-an-id').set(bearer(alice.token));
      const put = await request(app)
        .put('/api/notes/not-an-id')
        .set(bearer(alice.token))
        .send({ title: 'x' });
      const del = await request(app).delete('/api/notes/not-an-id').set(bearer(alice.token));
      assert.deepEqual([get.status, put.status, del.status], [400, 400, 400]);
    });

    it('ignores attempts to set the owner through the body', async () => {
      const res = await createNote(alice.token, { title: 'Sneaky', user: bob.user.id ?? bob.user._id });
      assert.equal(res.body.note.user, alice.user.id ?? alice.user._id);
    });
  });

  describe('Unauthorized access', () => {
    it('blocks every notes route without a token', async () => {
      const id = '507f1f77bcf86cd799439011';
      const responses = await Promise.all([
        request(app).get('/api/notes'),
        request(app).post('/api/notes').send({ title: 'x' }),
        request(app).get(`/api/notes/${id}`),
        request(app).put(`/api/notes/${id}`).send({ title: 'x' }),
        request(app).delete(`/api/notes/${id}`),
      ]);
      responses.forEach((res) => assert.equal(res.status, 401));
    });

    it('blocks routes with an invalid token', async () => {
      const res = await request(app).get('/api/notes').set(bearer('bad.token.value'));
      assert.equal(res.status, 401);
    });
  });

  describe('Cross-user access', () => {
    let aliceNoteId;

    before(async () => {
      const { body } = await createNote(alice.token, { title: 'Private', content: 'secret' });
      aliceNoteId = body.note._id;
    });

    it('hides notes from other users in the list', async () => {
      const res = await request(app).get('/api/notes').set(bearer(bob.token));
      assert.ok(res.body.notes.every((n) => n._id !== aliceNoteId));
    });

    it('denies reading another user note', async () => {
      const res = await request(app).get(`/api/notes/${aliceNoteId}`).set(bearer(bob.token));
      assert.equal(res.status, 404);
    });

    it('denies updating another user note and leaves it unchanged', async () => {
      const res = await request(app)
        .put(`/api/notes/${aliceNoteId}`)
        .set(bearer(bob.token))
        .send({ title: 'Hacked', content: 'hacked' });
      assert.equal(res.status, 404);
      const stored = await Note.findById(aliceNoteId);
      assert.equal(stored.title, 'Private');
    });

    it('denies deleting another user note and leaves it in place', async () => {
      const res = await request(app).delete(`/api/notes/${aliceNoteId}`).set(bearer(bob.token));
      assert.equal(res.status, 404);
      assert.ok(await Note.exists({ _id: aliceNoteId }));
    });

    it('does not leak notes through search', async () => {
      const res = await request(app).get('/api/notes?search=secret').set(bearer(bob.token));
      assert.equal(res.body.notes.length, 0);
    });
  });
});
