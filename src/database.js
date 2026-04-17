const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { hashPassword } = require("./security");

const authorsSeed = [
  { name: "Machado de Assis", country: "Brasil", birthYear: 1839 },
  { name: "Clarice Lispector", country: "Brasil", birthYear: 1920 },
  { name: "George Orwell", country: "Reino Unido", birthYear: 1903 },
  { name: "Jane Austen", country: "Reino Unido", birthYear: 1775 },
  { name: "Gabriel Garcia Marquez", country: "Colombia", birthYear: 1927 },
  { name: "J. K. Rowling", country: "Reino Unido", birthYear: 1965 },
];

const genresSeed = [
  "Romance",
  "Fantasia",
  "Distopia",
  "Classico",
  "Drama",
  "Realismo Magico",
];

const booksSeed = [
  ["Dom Casmurro", "978-85-359-0277-5", 1899, 256, "available", 1, 4],
  ["Memorias Postumas de Bras Cubas", "978-85-359-0278-2", 1881, 240, "available", 1, 4],
  ["Quincas Borba", "978-85-359-0279-9", 1891, 320, "borrowed", 1, 4],
  ["A Hora da Estrela", "978-85-359-1180-7", 1977, 96, "available", 2, 5],
  ["Perto do Coracao Selvagem", "978-85-359-1181-4", 1943, 208, "maintenance", 2, 5],
  ["A Paixao Segundo G.H.", "978-85-359-1182-1", 1964, 176, "available", 2, 5],
  ["1984", "978-85-359-1488-4", 1949, 416, "borrowed", 3, 3],
  ["A Revolucao dos Bichos", "978-85-359-1489-1", 1945, 152, "available", 3, 3],
  ["Homage to Catalonia", "978-85-359-1490-7", 1938, 288, "available", 3, 5],
  ["Orgulho e Preconceito", "978-85-359-2140-0", 1813, 424, "available", 4, 1],
  ["Emma", "978-85-359-2141-7", 1815, 480, "borrowed", 4, 1],
  ["Razao e Sensibilidade", "978-85-359-2142-4", 1811, 368, "available", 4, 1],
  ["Cem Anos de Solidao", "978-85-359-3001-3", 1967, 448, "available", 5, 6],
  ["Cronica de uma Morte Anunciada", "978-85-359-3002-0", 1981, 144, "available", 5, 6],
  ["O Amor nos Tempos do Colera", "978-85-359-3003-7", 1985, 432, "maintenance", 5, 6],
  ["Harry Potter e a Pedra Filosofal", "978-85-359-4120-0", 1997, 264, "available", 6, 2],
  ["Harry Potter e a Camara Secreta", "978-85-359-4121-7", 1998, 288, "available", 6, 2],
  ["Harry Potter e o Prisioneiro de Azkaban", "978-85-359-4122-4", 1999, 352, "borrowed", 6, 2],
  ["Harry Potter e o Calice de Fogo", "978-85-359-4123-1", 2000, 584, "available", 6, 2],
  ["Harry Potter e a Ordem da Fenix", "978-85-359-4124-8", 2003, 704, "available", 6, 2],
];

function ensureDirectoryForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createDatabase(dbPath) {
  ensureDirectoryForFile(dbPath);

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      birth_year INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      isbn TEXT NOT NULL UNIQUE,
      publication_year INTEGER NOT NULL,
      pages INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('available', 'borrowed', 'maintenance')),
      author_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      created_by_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES authors(id) ON DELETE RESTRICT,
      FOREIGN KEY(genre_id) REFERENCES genres(id) ON DELETE RESTRICT,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  return db;
}

function seedDatabase(db) {
  const hasUsers = db.prepare("SELECT COUNT(*) AS total FROM users").get().total > 0;

  if (hasUsers) {
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `);
  const insertAuthor = db.prepare(`
    INSERT INTO authors (name, country, birth_year)
    VALUES (?, ?, ?)
  `);
  const insertGenre = db.prepare(`
    INSERT INTO genres (name)
    VALUES (?)
  `);
  const insertBook = db.prepare(`
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
  `);

  const adminResult = insertUser.run(
    "Administrador",
    "admin@biblioteca.dev",
    hashPassword("Admin123!")
  );
  const adminId = Number(adminResult.lastInsertRowid);

  authorsSeed.forEach((author) => {
    insertAuthor.run(author.name, author.country, author.birthYear);
  });

  genresSeed.forEach((genre) => {
    insertGenre.run(genre);
  });

  booksSeed.forEach((book) => {
    insertBook.run(...book, adminId);
  });
}

function resetDatabase(db) {
  db.exec(`
    DELETE FROM books;
    DELETE FROM authors;
    DELETE FROM genres;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  seedDatabase(db);
}

function closeDatabase(db) {
  db.close();
}

module.exports = {
  closeDatabase,
  createDatabase,
  resetDatabase,
  seedDatabase,
};
