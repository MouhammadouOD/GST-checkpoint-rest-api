// Integration tests against the real Express app, using a real ephemeral MongoDB
// (mongodb-memory-server) and real HTTP requests (supertest). TOTAL_TESTS is checked
// at the end so this file only reports success if every assertion actually ran and passed.
const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const TOTAL_TESTS = 14;
let passed = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  passed++;
};

const run = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);

  const app = require('./server');

  // 1-2: GET /users on an empty collection
  const emptyRes = await request(app).get('/users');
  ok(emptyRes.status === 200, 'GET /users returns 200');
  ok(Array.isArray(emptyRes.body) && emptyRes.body.length === 0, 'GET /users returns an empty array initially');

  // 3-5: POST /users creates a new user
  const createRes = await request(app)
    .post('/users')
    .send({ name: 'Ada Lovelace', email: 'ada@example.com', age: 36 });
  ok(createRes.status === 201, 'POST /users returns 201');
  ok(createRes.body._id, 'POST /users returns the created document with an _id');
  ok(createRes.body.name === 'Ada Lovelace', 'POST /users persists the correct name');

  const userId = createRes.body._id;

  // 6-7: GET /users now returns the created user
  const listRes = await request(app).get('/users');
  ok(listRes.body.length === 1, 'GET /users reflects the newly created user');
  ok(listRes.body[0].email === 'ada@example.com', 'GET /users returns the correct email');

  // 8-9: PUT /users/:id updates the user
  const updateRes = await request(app)
    .put(`/users/${userId}`)
    .send({ age: 37 });
  ok(updateRes.status === 200, 'PUT /users/:id returns 200');
  ok(updateRes.body.age === 37, 'PUT /users/:id actually updates the age field');

  // 10: PUT on a non-existent id returns 404
  const fakeId = new mongoose.Types.ObjectId();
  const updateMissingRes = await request(app)
    .put(`/users/${fakeId}`)
    .send({ age: 99 });
  ok(updateMissingRes.status === 404, 'PUT /users/:id returns 404 for a non-existent user');

  // 11-12: DELETE /users/:id removes the user
  const deleteRes = await request(app).delete(`/users/${userId}`);
  ok(deleteRes.status === 200, 'DELETE /users/:id returns 200');
  ok(deleteRes.body._id === userId, 'DELETE /users/:id returns the deleted document');

  // 13: GET /users is empty again after delete
  const afterDeleteRes = await request(app).get('/users');
  ok(afterDeleteRes.body.length === 0, 'GET /users is empty again after deletion');

  // 14: DELETE on a non-existent id returns 404
  const deleteMissingRes = await request(app).delete(`/users/${fakeId}`);
  ok(deleteMissingRes.status === 404, 'DELETE /users/:id returns 404 for a non-existent user');

  await mongoose.disconnect();
  await mongod.stop();

  assert.strictEqual(
    passed,
    TOTAL_TESTS,
    `Expected ${TOTAL_TESTS} passing assertions, got ${passed}`
  );
  console.log(`${passed}/${TOTAL_TESTS} tests passed.`);
};

run().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
