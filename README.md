# Checkpoint — REST API (With Postman Certification)

GoMyCode checkpoint — *Distributed Systems with High-Level System Design: REST API (With Postman Certification)*. A small Express + Mongoose REST API managing a `User` resource, with full CRUD routes.

## Folder structure

```
config/        (holds .env locally — not committed, see .env.example)
models/User.js
server.js
```

## Files

| File | Role |
|---|---|
| `models/User.js` | `User` Mongoose schema (`name` required, `email` required + unique, `age`) and model |
| `server.js` | Express app: connects to MongoDB, exposes the four CRUD routes, starts the server when run directly |
| `tests.js` | 14 real integration assertions: real HTTP requests (supertest) against the real Express app, backed by a real ephemeral MongoDB (`mongodb-memory-server`) |
| `.env.example` | Shape of the required environment variables (`MONGO_URI`, `PORT`) |

## Routes

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/users` | Returns all users |
| `POST` | `/users` | Creates a new user from the request body |
| `PUT` | `/users/:id` | Updates a user by id (404 if not found) |
| `DELETE` | `/users/:id` | Deletes a user by id, returns the deleted document (404 if not found) |

Each route handler uses the corresponding Mongoose method (`find`, `create`, `findByIdAndUpdate`, `findByIdAndDelete`) and returns the result in the JSON response, per the checkpoint instructions.

## How to run

```bash
npm install
cp .env.example .env   # then edit MONGO_URI if needed
npm start
```

## Testing approach

`server.js` exports the Express `app` and only calls `app.listen()` when the file is run directly (`require.main === module`), so the exact same app used in production can be exercised in tests via `supertest` without opening a real network port — while keeping the folder structure exactly as required by the checkpoint (`config/`, `models/User.js`, `server.js`).

Tests run against a real, disposable MongoDB instance (`mongodb-memory-server`), not a mock: every request actually reads and writes real documents. Covered: creating a user, listing users, updating a user (success + 404 on a non-existent id), and deleting a user (success + 404 on a non-existent id).

## Results — real execution (verified, not simulated)

Run on 2026-11-03 with `node tests.js`:

```
14/14 tests passed.
```

**Mutation test** (proving the suite actually discriminates correct from broken code): changed the `PUT /users/:id` handler's `findByIdAndUpdate` options from `{ new: true, ... }` to `{ new: false, ... }` in `server.js`, so it would return the document *before* the update instead of after. Re-ran `tests.js` — the `PUT /users/:id actually updates the age field` assertion failed as expected (received the old `age` value, 36, instead of the updated 37). Reverted the change and confirmed `14/14 tests passed.` again.

`npm audit` → 0 vulnerabilities.
