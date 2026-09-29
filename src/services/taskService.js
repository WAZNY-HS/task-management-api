'use strict';

/**
 * BUSINESS LOGIC LAYER
 * Validation and rules live here. Knows nothing about HTTP (req/res)
 * and nothing about storage details; it only talks to the repository
 * it is given. Errors are plain objects with a `type` the controller maps.
 */
const STATUSES = ['todo', 'in-progress', 'done'];
const ALLOWED_TRANSITIONS = {
  todo: ['todo', 'in-progress'],
  'in-progress': ['in-progress', 'todo', 'done'],
  done: ['done'], // rule: a completed task cannot be reopened
};

class ServiceError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type; // 'validation' | 'not_found' | 'conflict'
  }
}

class TaskService {
  constructor(taskRepository) {
    this.repo = taskRepository;
  }

  listTasks(status) {
    if (status && !STATUSES.includes(status)) {
      throw new ServiceError('validation', `status must be one of: ${STATUSES.join(', ')}`);
    }
    const all = this.repo.findAll();
    return status ? all.filter((t) => t.status === status) : all;
  }

  getTask(id) {
    const task = this.repo.findById(id);
    if (!task) throw new ServiceError('not_found', `Task ${id} not found`);
    return task;
  }

  createTask({ title, description = '' } = {}) {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new ServiceError('validation', 'title is required and must be a non-empty string');
    }
    if (typeof description !== 'string') {
      throw new ServiceError('validation', 'description must be a string');
    }
    return this.repo.create({
      title: title.trim(),
      description,
      status: 'todo',
      createdAt: new Date().toISOString(),
    });
  }

  updateTask(id, changes = {}) {
    const current = this.getTask(id);
    const patch = {};

    if (changes.title !== undefined) {
      if (typeof changes.title !== 'string' || changes.title.trim() === '') {
        throw new ServiceError('validation', 'title must be a non-empty string');
      }
      patch.title = changes.title.trim();
    }
    if (changes.description !== undefined) {
      if (typeof changes.description !== 'string') {
        throw new ServiceError('validation', 'description must be a string');
      }
      patch.description = changes.description;
    }
    if (changes.status !== undefined) {
      if (!STATUSES.includes(changes.status)) {
        throw new ServiceError('validation', `status must be one of: ${STATUSES.join(', ')}`);
      }
      if (!ALLOWED_TRANSITIONS[current.status].includes(changes.status)) {
        throw new ServiceError('conflict', `Cannot move task from "${current.status}" to "${changes.status}"`);
      }
      patch.status = changes.status;
    }
    return this.repo.update(id, patch);
  }

  deleteTask(id) {
    this.getTask(id); // throws not_found if missing
    this.repo.delete(id);
  }
}

module.exports = { TaskService, ServiceError };
