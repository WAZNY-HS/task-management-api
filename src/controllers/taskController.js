'use strict';

/**
 * PRESENTATION LAYER
 * Translates HTTP <-> service calls. Parses input, calls the service,
 * maps results/errors to status codes. Contains zero business rules
 * and never touches the repository.
 */
const STATUS_BY_ERROR = { validation: 400, not_found: 404, conflict: 409 };

class TaskController {
  constructor(taskService) {
    this.service = taskService;
  }

  handle(fn) {
    return async (req, res, params, query, body) => {
      try {
        const { status = 200, data } = fn(params, query, body);
        return send(res, status, data);
      } catch (err) {
        const status = STATUS_BY_ERROR[err.type];
        if (!status) {
          console.error(err);
          return send(res, 500, { error: 'Internal server error' });
        }
        return send(res, status, { error: err.message });
      }
    };
  }

  list = this.handle((_p, query) => ({ data: this.service.listTasks(query.status) }));
  get = this.handle((p) => ({ data: this.service.getTask(Number(p.id)) }));
  create = this.handle((_p, _q, body) => ({ status: 201, data: this.service.createTask(body) }));
  update = this.handle((p, _q, body) => ({ data: this.service.updateTask(Number(p.id), body) }));
  remove = this.handle((p) => {
    this.service.deleteTask(Number(p.id));
    return { status: 204, data: null };
  });
}

function send(res, status, data) {
  if (data === null) {
    res.writeHead(status);
    return res.end();
  }
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = TaskController;
