# Task API — a Structured 3-Tier Monolith

A Task Management REST API built for the **"From Code to Architecture: Understanding the Monolith"** workshop. It is one deployable unit (a monolith) whose code is split into three strictly separated layers.

Zero dependencies — only Node.js (v18+).

## Project structure

```
task-api/
├── src/
│   ├── controllers/    # Presentation Layer  (HTTP handling)
│   │   └── taskController.js
│   ├── services/       # Business Logic Layer (core rules)
│   │   └── taskService.js
│   ├── repositories/   # Data Access Layer   (storage handling)
│   │   └── taskRepository.js
│   ├── app.js          # Composition root: wires layers + routes
│   └── server.js       # Starts the HTTP server
├── test/api.test.js
├── .gitignore
├── README.md
└── package.json
```

## How to run

```bash
git clone <your-repo-url>
cd task-api
npm start          # http://localhost:3000  (set PORT to change)
npm test           # runs the tests (Node's built-in test runner)
```

### Try it

```bash
# create
curl -X POST localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Learn layers"}'
# list (optionally ?status=todo|in-progress|done)
curl localhost:3000/tasks
# get one
curl localhost:3000/tasks/1
# update status (todo -> in-progress -> done)
curl -X PATCH localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"status":"in-progress"}'
# delete
curl -X DELETE localhost:3000/tasks/1
```

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/tasks` | 200 list | 400 bad status filter |
| POST | `/tasks` | 201 task | 400 missing/empty title |
| GET | `/tasks/:id` | 200 task | 404 |
| PUT/PATCH | `/tasks/:id` | 200 task | 400, 404, 409 illegal status change |
| DELETE | `/tasks/:id` | 204 | 404 |

## How the code maintains layer separation

Dependencies point **one way only**: `controller → service → repository`.

| Layer | Responsibility | Allowed to know about | Must NOT contain |
|---|---|---|---|
| **Controller** | Parse the request, call one service method, map the result/error to an HTTP status | The service | Business rules, storage code |
| **Service** | Validation and rules (title required, `done` tasks can't be reopened, `todo` can't jump to `done`) | The repository | `req`/`res`, status codes, storage details |
| **Repository** | Create/read/update/delete tasks in an in-memory `Map` | Nothing above it | Validation, HTTP |

How this is enforced in practice:

1. **Constructor injection.** `TaskController` receives a `TaskService`; `TaskService` receives a `TaskRepository`. Neither creates its own dependency, so no layer can reach past its neighbour.
2. **Only `app.js` sees all three layers.** It is the single place where they are wired together.
3. **Errors cross layers as typed errors, not HTTP codes.** The service throws `ServiceError` with a `type` (`validation`, `not_found`, `conflict`); only the controller turns those into 400/404/409.
4. **The service is testable without HTTP** (see the first two tests), which proves the business layer is isolated from transport.
5. **Storage is swappable.** Replace `taskRepository.js` with a database version exposing the same methods and the service and controller do not change.

## Why a modular monolith?

Simple to develop, test end-to-end, and deploy as a single artifact, with none of the network latency of distributed systems. Strict layer boundaries are what stop it becoming a "Big Ball of Mud" and keep the door open to extract services later.
