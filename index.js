const express = require("express");
const path = require("node:path");
const {
  createDatabase,
  seedDatabase,
  resetDatabase,
  closeDatabase,
} = require("./src/database");
const {
  createToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} = require("./src/security");
const {
  validateAuthorPayload,
  validateBookPayload,
  validateLoginPayload,
  validatePagination,
  validateRegisterPayload,
} = require("./src/validation");

const DEFAULT_DB_PATH = path.join(__dirname, "data", "library.sqlite");
const DEFAULT_JWT_SECRET =
  process.env.JWT_SECRET || "atividade-api-secret-change-me";
const PORT = Number(process.env.PORT || 3000);

function jsonError(res, status, message, details) {
  return res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
  });
}

function parsePositiveInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function requireAuth(secret) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return jsonError(res, 401, "Token JWT ausente ou mal formatado.");
    }

    try {
      const payload = verifyToken(token, secret);
      const user = req.app.locals.db
        .prepare(
          "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1"
        )
        .get(payload.sub);

      if (!user) {
        return jsonError(res, 401, "Usuario autenticado nao foi encontrado.");
      }

      req.user = user;
      return next();
    } catch (error) {
      return jsonError(res, 401, error.message);
    }
  };
}

function buildBookFilters(query) {
  const filters = [];
  const params = [];

  if (query.q) {
    filters.push("(b.title LIKE ? OR a.name LIKE ? OR g.name LIKE ?)");
    const searchTerm = `%${String(query.q).trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (query.status) {
    filters.push("b.status = ?");
    params.push(String(query.status).trim().toLowerCase());
  }

  const authorId = parsePositiveInteger(query.authorId);
  if (authorId) {
    filters.push("b.author_id = ?");
    params.push(authorId);
  }

  const genreId = parsePositiveInteger(query.genreId);
  if (genreId) {
    filters.push("b.genre_id = ?");
    params.push(genreId);
  }

  const yearMin = parsePositiveInteger(query.yearMin);
  if (yearMin) {
    filters.push("b.publication_year >= ?");
    params.push(yearMin);
  }

  const yearMax = parsePositiveInteger(query.yearMax);
  if (yearMax) {
    filters.push("b.publication_year <= ?");
    params.push(yearMax);
  }

  return {
    whereClause: filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "",
    params,
  };
}

function mapBookRow(row) {
  return {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    publicationYear: row.publication_year,
    pages: row.pages,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      country: row.author_country,
    },
    genre: {
      id: row.genre_id,
      name: row.genre_name,
    },
    createdBy: {
      id: row.created_by_user_id,
      name: row.created_by_name,
      email: row.created_by_email,
    },
  };
}

function getBookById(db, id) {
  const row = db
    .prepare(
      `
      SELECT
        b.id,
        b.title,
        b.isbn,
        b.publication_year,
        b.pages,
        b.status,
        b.created_at,
        b.updated_at,
        a.id AS author_id,
        a.name AS author_name,
        a.country AS author_country,
        g.id AS genre_id,
        g.name AS genre_name,
        u.id AS created_by_user_id,
        u.name AS created_by_name,
        u.email AS created_by_email
      FROM books b
      INNER JOIN authors a ON a.id = b.author_id
      INNER JOIN genres g ON g.id = b.genre_id
      INNER JOIN users u ON u.id = b.created_by_user_id
      WHERE b.id = ?
      LIMIT 1
    `
    )
    .get(id);

  return row ? mapBookRow(row) : null;
}

function createApp(options = {}) {
  const dbPath = options.dbPath || process.env.DB_PATH || DEFAULT_DB_PATH;
  const jwtSecret = options.jwtSecret || DEFAULT_JWT_SECRET;
  const db = createDatabase(dbPath);

  if (options.seed !== false) {
    seedDatabase(db);
  }

  const app = express();

  app.locals.db = db;
  app.locals.dbPath = dbPath;
  app.locals.jwtSecret = jwtSecret;

  app.use(express.json());

  app.get("/", (_req, res) => {
    const totalBooks = db.prepare("SELECT COUNT(*) AS total FROM books").get().total;

    return res.json({
      project: "Biblioteca API",
      status: "online",
      database: "SQLite",
      authentication: "JWT Bearer",
      seededRecords: totalBooks,
      sampleCredentials: {
        email: "admin@biblioteca.dev",
        password: "Admin123!",
      },
      routes: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/profile",
        authors: "GET /api/authors",
        genres: "GET /api/genres",
        books: "GET /api/books",
      },
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const validation = validateRegisterPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Dados de cadastro invalidos.", validation.errors);
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .get(validation.data.email);

    if (existingUser) {
      return jsonError(res, 409, "Ja existe um usuario com esse email.");
    }

    const passwordHash = hashPassword(validation.data.password);
    const result = db
      .prepare(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
      `
      )
      .run(validation.data.name, validation.data.email, passwordHash);

    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    const token = createToken(
      { sub: user.id, email: user.email, name: user.name },
      jwtSecret
    );

    return res.status(201).json({
      message: "Usuario cadastrado com sucesso.",
      user,
      token,
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const validation = validateLoginPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Credenciais invalidas.", validation.errors);
    }

    const user = db
      .prepare(
        `
        SELECT id, name, email, password_hash, created_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `
      )
      .get(validation.data.email);

    if (!user || !verifyPassword(validation.data.password, user.password_hash)) {
      return jsonError(res, 401, "Email ou senha invalidos.");
    }

    const token = createToken(
      { sub: user.id, email: user.email, name: user.name },
      jwtSecret
    );

    return res.json({
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  });

  app.get("/api/profile", requireAuth(jwtSecret), (req, res) => {
    const totalCreatedBooks = db
      .prepare("SELECT COUNT(*) AS total FROM books WHERE created_by_user_id = ?")
      .get(req.user.id).total;

    return res.json({
      user: req.user,
      statistics: {
        createdBooks: totalCreatedBooks,
      },
    });
  });

  app.get("/api/genres", (_req, res) => {
    const genres = db.prepare(
      `
      SELECT
        g.id,
        g.name,
        COUNT(b.id) AS total_books
      FROM genres g
      LEFT JOIN books b ON b.genre_id = g.id
      GROUP BY g.id
      ORDER BY g.name ASC
    `
    ).all();

    return res.json(genres);
  });

  app.get("/api/authors", (req, res) => {
    const { page, limit, offset } = validatePagination(req.query);
    const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
    const country = req.query.country ? String(req.query.country).trim() : null;
    const sortBy = ["name", "birth_year", "country"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "name";
    const order = String(req.query.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const filters = [];
    const params = [];

    if (search) {
      filters.push("a.name LIKE ?");
      params.push(search);
    }

    if (country) {
      filters.push("a.country = ?");
      params.push(country);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const total = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM authors a
        ${whereClause}
      `
      )
      .get(...params).total;

    const authors = db
      .prepare(
        `
        SELECT
          a.id,
          a.name,
          a.country,
          a.birth_year,
          a.created_at,
          COUNT(b.id) AS total_books
        FROM authors a
        LEFT JOIN books b ON b.author_id = a.id
        ${whereClause}
        GROUP BY a.id
        ORDER BY a.${sortBy} ${order}
        LIMIT ? OFFSET ?
      `
      )
      .all(...params, limit, offset);

    return res.json({
      data: authors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  });

  app.get("/api/authors/:id", (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de autor invalido.");
    }

    const author = db
      .prepare(
        `
        SELECT id, name, country, birth_year, created_at
        FROM authors
        WHERE id = ?
        LIMIT 1
      `
      )
      .get(id);

    if (!author) {
      return jsonError(res, 404, "Autor nao encontrado.");
    }

    const books = db
      .prepare(
        `
        SELECT
          b.id,
          b.title,
          b.isbn,
          b.publication_year,
          b.pages,
          b.status,
          g.id AS genre_id,
          g.name AS genre_name
        FROM books b
        INNER JOIN genres g ON g.id = b.genre_id
        WHERE b.author_id = ?
        ORDER BY b.title ASC
      `
      )
      .all(id)
      .map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        publicationYear: book.publication_year,
        pages: book.pages,
        status: book.status,
        genre: {
          id: book.genre_id,
          name: book.genre_name,
        },
      }));

    return res.json({
      ...author,
      books,
    });
  });

  app.post("/api/authors", requireAuth(jwtSecret), (req, res) => {
    const validation = validateAuthorPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Dados do autor invalidos.", validation.errors);
    }

    const result = db
      .prepare(
        `
        INSERT INTO authors (name, country, birth_year)
        VALUES (?, ?, ?)
      `
      )
      .run(
        validation.data.name,
        validation.data.country,
        validation.data.birthYear
      );

    const author = db
      .prepare("SELECT id, name, country, birth_year, created_at FROM authors WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json(author);
  });

  app.put("/api/authors/:id", requireAuth(jwtSecret), (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de autor invalido.");
    }

    const existingAuthor = db
      .prepare("SELECT id FROM authors WHERE id = ? LIMIT 1")
      .get(id);

    if (!existingAuthor) {
      return jsonError(res, 404, "Autor nao encontrado.");
    }

    const validation = validateAuthorPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Dados do autor invalidos.", validation.errors);
    }

    db.prepare(
      `
      UPDATE authors
      SET name = ?, country = ?, birth_year = ?
      WHERE id = ?
    `
    ).run(
      validation.data.name,
      validation.data.country,
      validation.data.birthYear,
      id
    );

    const author = db
      .prepare("SELECT id, name, country, birth_year, created_at FROM authors WHERE id = ?")
      .get(id);

    return res.json(author);
  });

  app.delete("/api/authors/:id", requireAuth(jwtSecret), (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de autor invalido.");
    }

    const author = db
      .prepare("SELECT id FROM authors WHERE id = ? LIMIT 1")
      .get(id);

    if (!author) {
      return jsonError(res, 404, "Autor nao encontrado.");
    }

    const booksCount = db
      .prepare("SELECT COUNT(*) AS total FROM books WHERE author_id = ?")
      .get(id).total;

    if (booksCount > 0) {
      return jsonError(
        res,
        409,
        "Nao e possivel remover um autor que ainda possui livros vinculados."
      );
    }

    db.prepare("DELETE FROM authors WHERE id = ?").run(id);
    return res.status(204).send();
  });

  app.get("/api/books", (req, res) => {
    const { page, limit, offset } = validatePagination(req.query);
    const { whereClause, params } = buildBookFilters(req.query);
    const sortColumnMap = {
      title: "b.title",
      publicationYear: "b.publication_year",
      pages: "b.pages",
      createdAt: "b.created_at",
    };
    const sortBy = sortColumnMap[req.query.sortBy] || "b.title";
    const order = String(req.query.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const total = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM books b
        INNER JOIN authors a ON a.id = b.author_id
        INNER JOIN genres g ON g.id = b.genre_id
        ${whereClause}
      `
      )
      .get(...params).total;

    const rows = db
      .prepare(
        `
        SELECT
          b.id,
          b.title,
          b.isbn,
          b.publication_year,
          b.pages,
          b.status,
          b.created_at,
          b.updated_at,
          a.id AS author_id,
          a.name AS author_name,
          a.country AS author_country,
          g.id AS genre_id,
          g.name AS genre_name,
          u.id AS created_by_user_id,
          u.name AS created_by_name,
          u.email AS created_by_email
        FROM books b
        INNER JOIN authors a ON a.id = b.author_id
        INNER JOIN genres g ON g.id = b.genre_id
        INNER JOIN users u ON u.id = b.created_by_user_id
        ${whereClause}
        ORDER BY ${sortBy} ${order}
        LIMIT ? OFFSET ?
      `
      )
      .all(...params, limit, offset);

    return res.json({
      data: rows.map(mapBookRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  });

  app.get("/api/books/:id", (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de livro invalido.");
    }

    const book = getBookById(db, id);

    if (!book) {
      return jsonError(res, 404, "Livro nao encontrado.");
    }

    return res.json(book);
  });

  app.post("/api/books", requireAuth(jwtSecret), (req, res) => {
    const validation = validateBookPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Dados do livro invalidos.", validation.errors);
    }

    const duplicateIsbn = db
      .prepare("SELECT id FROM books WHERE isbn = ? LIMIT 1")
      .get(validation.data.isbn);

    if (duplicateIsbn) {
      return jsonError(res, 409, "Ja existe um livro cadastrado com esse ISBN.");
    }

    const author = db
      .prepare("SELECT id FROM authors WHERE id = ? LIMIT 1")
      .get(validation.data.authorId);
    const genre = db
      .prepare("SELECT id FROM genres WHERE id = ? LIMIT 1")
      .get(validation.data.genreId);

    if (!author) {
      return jsonError(res, 400, "O authorId informado nao existe.");
    }

    if (!genre) {
      return jsonError(res, 400, "O genreId informado nao existe.");
    }

    const result = db
      .prepare(
        `
        INSERT INTO books (
          title,
          isbn,
          publication_year,
          pages,
          status,
          author_id,
          genre_id,
          created_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        validation.data.title,
        validation.data.isbn,
        validation.data.publicationYear,
        validation.data.pages,
        validation.data.status,
        validation.data.authorId,
        validation.data.genreId,
        req.user.id
      );

    return res.status(201).json(getBookById(db, result.lastInsertRowid));
  });

  app.put("/api/books/:id", requireAuth(jwtSecret), (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de livro invalido.");
    }

    const existingBook = db
      .prepare("SELECT id FROM books WHERE id = ? LIMIT 1")
      .get(id);

    if (!existingBook) {
      return jsonError(res, 404, "Livro nao encontrado.");
    }

    const validation = validateBookPayload(req.body);

    if (!validation.valid) {
      return jsonError(res, 400, "Dados do livro invalidos.", validation.errors);
    }

    const duplicateIsbn = db
      .prepare("SELECT id FROM books WHERE isbn = ? AND id <> ? LIMIT 1")
      .get(validation.data.isbn, id);

    if (duplicateIsbn) {
      return jsonError(res, 409, "Ja existe outro livro cadastrado com esse ISBN.");
    }

    const author = db
      .prepare("SELECT id FROM authors WHERE id = ? LIMIT 1")
      .get(validation.data.authorId);
    const genre = db
      .prepare("SELECT id FROM genres WHERE id = ? LIMIT 1")
      .get(validation.data.genreId);

    if (!author) {
      return jsonError(res, 400, "O authorId informado nao existe.");
    }

    if (!genre) {
      return jsonError(res, 400, "O genreId informado nao existe.");
    }

    db.prepare(
      `
      UPDATE books
      SET
        title = ?,
        isbn = ?,
        publication_year = ?,
        pages = ?,
        status = ?,
        author_id = ?,
        genre_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(
      validation.data.title,
      validation.data.isbn,
      validation.data.publicationYear,
      validation.data.pages,
      validation.data.status,
      validation.data.authorId,
      validation.data.genreId,
      id
    );

    return res.json(getBookById(db, id));
  });

  app.delete("/api/books/:id", requireAuth(jwtSecret), (req, res) => {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return jsonError(res, 400, "ID de livro invalido.");
    }

    const result = db.prepare("DELETE FROM books WHERE id = ?").run(id);

    if (result.changes === 0) {
      return jsonError(res, 404, "Livro nao encontrado.");
    }

    return res.status(204).send();
  });

  app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return jsonError(res, 400, "JSON invalido no corpo da requisicao.");
    }

    return next(error);
  });

  app.use((_req, res) => {
    return jsonError(res, 404, "Rota nao encontrada.");
  });

  return {
    app,
    db,
    close: () => closeDatabase(db),
    reset: () => resetDatabase(db),
  };
}

if (require.main === module) {
  const { app } = createApp();
  app.listen(PORT, () => {
    console.log(`Biblioteca API rodando em http://localhost:${PORT}`);
  });
}

module.exports = {
  createApp,
};
