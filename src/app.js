'use strict';

/**
 * Composition root: the ONLY file that knows all three layers.
 * Wires repository -> service -> controller and defines routes.
 * Dependencies point one way: controller -> service -> repository.
 */
const http = require('http');
const TaskRepository = require('./repositories/taskRepository');
const { TaskService } = require('./services/taskService');
const TaskController = require('./controllers/taskController');

function createApp() {
  const repository = new TaskRepository();
  const service = new TaskService(repository);
  const controller = new TaskController(service);

  const routes = [
    ['GET', /^\/tasks$/, [], controller.list],
    ['POST', /^\/tasks$/, [], controller.create],
    ['GET', /^\/tasks\/(\d+)$/, ['id'], controller.get],
    ['PUT', /^\/tasks\/(\d+)$/, ['id'], controller.update],
    ['PATCH', /^\/tasks\/(\d+)$/, ['id'], controller.update],
    ['DELETE', /^\/tasks\/(\d+)$/, ['id'], controller.remove],
  ];

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathMatches = routes.filter(([, re]) => re.test(url.pathname));

    if (pathMatches.length === 0) return json(res, 404, { error: 'Route not found' });

    const route = pathMatches.find(([method]) => method === req.method);
    if (!route) return json(res, 405, { error: 'Method not allowed' });

    const [, re, names, handler] = route;
    const match = url.pathname.match(re);
    const params = Object.fromEntries(names.map((n, i) => [n, match[i + 1]]));
    const query = Object.fromEntries(url.searchParams);

    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }
    return handler(req, res, params, query, body);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = { createApp };
