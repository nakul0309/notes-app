const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
require('./helpers');

const PORT = 5055;
const BASE = `http://127.0.0.1:${PORT}/api`;

const startServer = async () => {
  const child = spawn('node', [path.join(__dirname, '../src/server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return child;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  child.kill();
  throw new Error('Server did not start');
};

const stopServer = (child) =>
  new Promise((resolve) => {
    child.once('exit', resolve);
    child.kill('SIGTERM');
  });

describe('Persistence across server restart', () => {
  let server;
  after(async () => {
    if (server && server.exitCode === null) await stopServer(server);
    const { setupDatabase, teardownDatabase } = require('./helpers');
    await setupDatabase();
    await teardownDatabase();
  });

  it('keeps users and notes after the API process restarts', async () => {
    const { setupDatabase } = require('./helpers');
    await setupDatabase();
    require('mongoose').disconnect();

    server = await startServer();
    const credentials = { name: 'Persist', email: 'persist@example.com', password: 'Passw0rd123' };
    const register = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    assert.equal(register.status, 201);
    const { token } = await register.json();
    const created = await fetch(`${BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Survives restart', content: 'still here' }),
    });
    assert.equal(created.status, 201);
    await stopServer(server);

    server = await startServer();
    const login = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    assert.equal(login.status, 200);
    const { token: newToken } = await login.json();
    const oldTokenStillValid = await fetch(`${BASE}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(oldTokenStillValid.status, 200);
    const list = await fetch(`${BASE}/notes`, { headers: { Authorization: `Bearer ${newToken}` } });
    const { notes } = await list.json();
    assert.equal(notes.length, 1);
    assert.equal(notes[0].title, 'Survives restart');
  });
});
