'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { TaskService } = require('../src/services/taskService');
const TaskRepository = require('../src/repositories/taskRepository');

// Service tests use a fresh repository: proves the business layer runs with NO HTTP.
test('service: rejects empty title', () => {
  const svc = new TaskService(new TaskRepository());
  assert.throws(() => svc.createTask({ title: '  ' }), { type: 'validation' });
});

test('service: done tasks cannot be reopened', () => {
  const svc = new TaskService(new TaskRepository());
  const t = svc.createTask({ title: 'x' });
  assert.throws(() => svc.updateTask(t.id, { status: 'done' }), { type: 'conflict' }); // must go via in-progress
  svc.updateTask(t.id, { status: 'in-progress' });
  svc.updateTask(t.id, { status: 'done' });
  assert.throws(() => svc.updateTask(t.id, { status: 'todo' }), { type: 'conflict' });
});

test('http: full CRUD flow', async (t) => {
  const server = createApp().listen(0);
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://localhost:${server.address().port}`;
  const call = (path, method = 'GET', body) =>
    fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });

  let r = await call('/tasks', 'POST', { title: 'Learn layers' });
  assert.strictEqual(r.status, 201);
  const created = await r.json();
  assert.strictEqual(created.status, 'todo');

  r = await call('/tasks', 'POST', {});
  assert.strictEqual(r.status, 400);

  r = await call(`/tasks/${created.id}`, 'PATCH', { status: 'in-progress' });
  assert.strictEqual((await r.json()).status, 'in-progress');
  r = await call(`/tasks/${created.id}`, 'PATCH', { status: 'done' });
  assert.strictEqual((await r.json()).status, 'done');

  r = await call(`/tasks/${created.id}`, 'PATCH', { status: 'todo' });
  assert.strictEqual(r.status, 409);

  r = await call('/tasks?status=done');
  assert.strictEqual((await r.json()).length, 1);

  r = await call(`/tasks/${created.id}`, 'DELETE');
  assert.strictEqual(r.status, 204);

  r = await call(`/tasks/${created.id}`);
  assert.strictEqual(r.status, 404);

});
