'use strict';

/**
 * DATA ACCESS LAYER
 * Only place that knows HOW tasks are stored (here: an in-memory Map).
 * No HTTP, no business rules. Swap this file for a DB version and
 * nothing above it changes.
 */
class TaskRepository {
  constructor() {
    this.tasks = new Map();
    this.nextId = 1;
  }

  findAll() {
    return [...this.tasks.values()];
  }

  findById(id) {
    return this.tasks.get(id) || null;
  }

  create(data) {
    const task = { id: this.nextId++, ...data };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id, changes) {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id) {
    return this.tasks.delete(id);
  }
}

module.exports = TaskRepository;
