const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createApp } = require("./index");

const TEST_DB_PATH = path.join(__dirname, "tmp", "library.test.sqlite");

let server;
let baseUrl;
let helpers;

function removeTestDatabase() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH, { force: true });
  }
}

async function loginAsAdmin() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@biblioteca.dev",
      password: "Admin123!",
    }),
  });

  const data = await response.json();
  return data.token;
}

test.before(async () => {
  removeTestDatabase();
  helpers = createApp({
    dbPath: TEST_DB_PATH,
    jwtSecret: "test-secret",
  });
  server = helpers.app.listen(0);

  await new Promise((resolve) => {
    server.on("listening", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.beforeEach(() => {
  helpers.reset();
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  helpers.close();
  removeTestDatabase();
});

test("GET / retorna metadados do projeto e quantidade seedada", async () => {
  const response = await fetch(`${baseUrl}/`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.project, "Biblioteca API");
  assert.equal(data.seededRecords, 20);
  assert.equal(data.authentication, "JWT Bearer");
});

test("POST /api/auth/login autentica com usuario seedado", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@biblioteca.dev",
      password: "Admin123!",
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.token);
  assert.equal(data.user.email, "admin@biblioteca.dev");
});

test("POST /api/auth/register cria usuario novo", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Leitora Teste",
      email: "leitora@example.com",
      password: "Senha123",
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.user.email, "leitora@example.com");
  assert.ok(data.token);
});

test("GET /api/profile exige autenticacao JWT", async () => {
  const response = await fetch(`${baseUrl}/api/profile`);
  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "Token JWT ausente ou mal formatado.");
});

test("GET /api/profile retorna dados do usuario autenticado", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.user.email, "admin@biblioteca.dev");
  assert.equal(data.statistics.createdBooks, 20);
});

test("GET /api/books suporta filtro, ordenacao e paginacao com JOINs", async () => {
  const response = await fetch(
    `${baseUrl}/api/books?status=available&genreId=2&sortBy=publicationYear&order=desc&page=1&limit=3`
  );
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.data.length, 3);
  assert.equal(data.pagination.page, 1);
  assert.ok(data.data[0].author.name);
  assert.ok(data.data[0].genre.name);
  assert.ok(data.data[0].createdBy.email);
});

test("GET /api/authors lista autores com total de livros", async () => {
  const response = await fetch(`${baseUrl}/api/authors?country=Brasil&limit=5`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.data.length, 2);
  assert.ok(data.data.every((author) => typeof author.total_books === "number"));
});

test("POST /api/books cria livro novo autenticado", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Biblioteca em Testes",
      isbn: "978-65-0000-0001-0",
      publicationYear: 2024,
      pages: 220,
      status: "available",
      authorId: 1,
      genreId: 4,
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.title, "Biblioteca em Testes");
  assert.equal(data.author.id, 1);
  assert.equal(data.genre.id, 4);
});

test("POST /api/books valida ISBN duplicado", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Livro Repetido",
      isbn: "978-85-359-0277-5",
      publicationYear: 2020,
      pages: 180,
      status: "available",
      authorId: 1,
      genreId: 4,
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 409);
  assert.equal(data.error, "Ja existe um livro cadastrado com esse ISBN.");
});

test("PUT /api/books/:id atualiza livro existente", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/books/1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Dom Casmurro - Edicao Revisada",
      isbn: "978-85-359-0277-5",
      publicationYear: 1899,
      pages: 300,
      status: "maintenance",
      authorId: 1,
      genreId: 4,
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.pages, 300);
  assert.equal(data.status, "maintenance");
});

test("DELETE /api/books/:id remove livro existente", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/books/20`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(response.status, 204);

  const followUp = await fetch(`${baseUrl}/api/books/20`);
  assert.equal(followUp.status, 404);
});

test("DELETE /api/authors/:id bloqueia exclusao quando ha livros relacionados", async () => {
  const token = await loginAsAdmin();
  const response = await fetch(`${baseUrl}/api/authors/1`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  assert.equal(response.status, 409);
  assert.equal(
    data.error,
    "Nao e possivel remover um autor que ainda possui livros vinculados."
  );
});
