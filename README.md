# Biblioteca API

API RESTful em Node.js + Express com persistencia 100% em SQLite. O projeto foi pensado como entrega final e cobre:

- CRUD completo de livros e autores
- autenticacao JWT
- relacionamentos com `JOIN` entre `books`, `authors`, `genres` e `users`
- filtros, ordenacao e paginacao
- validacoes robustas
- status codes corretos
- seed automatica com 20 livros
- testes automatizados
- deploy pronto para Render

## Tema

O tema escolhido foi **biblioteca**. A API permite cadastrar usuarios, autenticar com JWT e gerenciar autores, generos e livros.

## Stack

- Node.js 24
- Express 5
- SQLite via `node:sqlite`
- JWT implementado com `crypto`
- Testes com `node:test`

## Como executar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Rode o servidor:

```bash
npm start
```

3. A API ficara disponivel em:

```text
http://localhost:3000
```

## Scripts

```bash
npm start
npm run dev
npm test
```

## Variaveis de ambiente

Crie um arquivo `.env` se quiser personalizar:

```env
PORT=3000
JWT_SECRET=troque-esta-chave
DB_PATH=./data/library.sqlite
```

Se nenhuma variavel for informada, a API sobe com valores padrao.

## Banco SQLite

Ao iniciar a aplicacao, o banco SQLite e criado automaticamente em `data/library.sqlite`.

Tabelas:

- `users`
- `authors`
- `genres`
- `books`

Relacionamentos implementados:

- `books.author_id -> authors.id`
- `books.genre_id -> genres.id`
- `books.created_by_user_id -> users.id`

## Seed inicial

A aplicacao sobe com:

- 1 usuario administrador
- 6 autores
- 6 generos
- 20 livros

Credenciais iniciais:

```json
{
  "email": "admin@biblioteca.dev",
  "password": "Admin123!"
}
```

## Rotas

### Publicas

#### `GET /`

Status: `200 OK`

Exemplo de resposta:

```json
{
  "project": "Biblioteca API",
  "status": "online",
  "database": "SQLite",
  "authentication": "JWT Bearer",
  "seededRecords": 20
}
```

#### `POST /api/auth/register`

Cria um usuario e devolve token JWT.

Body:

```json
{
  "name": "Leitora Silva",
  "email": "leitora@example.com",
  "password": "Senha123"
}
```

Status:

- `201 Created`
- `400 Bad Request`
- `409 Conflict`

#### `POST /api/auth/login`

Body:

```json
{
  "email": "admin@biblioteca.dev",
  "password": "Admin123!"
}
```

Status:

- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`

#### `GET /api/genres`

Lista generos com contagem de livros.

Status: `200 OK`

#### `GET /api/authors`

Exemplo com filtro, ordenacao e paginacao:

```http
GET /api/authors?country=Brasil&search=Machado&sortBy=name&order=asc&page=1&limit=5
```

Status: `200 OK`

#### `GET /api/authors/:id`

Retorna um autor com seus livros.

Status:

- `200 OK`
- `400 Bad Request`
- `404 Not Found`

#### `GET /api/books`

Exemplo completo:

```http
GET /api/books?q=Harry&status=available&genreId=2&sortBy=publicationYear&order=desc&page=1&limit=3
```

Filtros suportados:

- `q`
- `status`
- `authorId`
- `genreId`
- `yearMin`
- `yearMax`

Ordenacao suportada:

- `title`
- `publicationYear`
- `pages`
- `createdAt`

Status: `200 OK`

#### `GET /api/books/:id`

Retorna um livro com dados relacionados de autor, genero e usuario criador.

Status:

- `200 OK`
- `400 Bad Request`
- `404 Not Found`

### Protegidas por JWT

Para as rotas abaixo envie:

```http
Authorization: Bearer <token>
```

#### `GET /api/profile`

Retorna o perfil autenticado e estatisticas.

#### `POST /api/authors`

Body:

```json
{
  "name": "Neil Gaiman",
  "country": "Reino Unido",
  "birthYear": 1960
}
```

Status:

- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`

#### `PUT /api/authors/:id`

Atualiza um autor.

#### `DELETE /api/authors/:id`

Remove um autor sem livros vinculados.

Status:

- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`
- `409 Conflict`

#### `POST /api/books`

Body:

```json
{
  "title": "Biblioteca em Testes",
  "isbn": "978-65-0000-0001-0",
  "publicationYear": 2024,
  "pages": 220,
  "status": "available",
  "authorId": 1,
  "genreId": 4
}
```

Status:

- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `409 Conflict`

#### `PUT /api/books/:id`

Atualiza um livro existente.

#### `DELETE /api/books/:id`

Remove um livro existente.

Status:

- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`

## Validacoes implementadas

### Usuarios

- `name` minimo de 3 caracteres
- `email` obrigatorio e valido
- `password` minimo de 6 caracteres
- email unico

### Autores

- `name` minimo de 3 caracteres
- `country` minimo de 2 caracteres
- `birthYear` entre 1500 e ano atual

### Livros

- `title` minimo de 2 caracteres
- `isbn` com pelo menos 10 caracteres e formato alfanumerico
- `publicationYear` entre 1450 e o ano seguinte ao atual
- `pages` entre 1 e 5000
- `status` limitado a `available`, `borrowed`, `maintenance`
- `authorId` e `genreId` obrigatorios e positivos
- ISBN unico
- validacao de existencia de autor e genero

## Testes automatizados

Rode:

```bash
npm test
```

Os testes cobrem:

- healthcheck
- login e registro
- autenticacao JWT
- filtros, paginacao e ordenacao
- CRUD de livros
- regra de conflito ao excluir autor com livros vinculados

## Postman

A collection exportada esta em:

```text
postman_collection.json
```

Ela inclui exemplos de todas as rotas, com variaveis `baseUrl` e `token`.

Fluxo sugerido no Postman:

1. Executar `Login`
2. Copiar o token retornado
3. Salvar na variavel `token`
4. Testar as rotas protegidas

## Deploy

O repositorio inclui `render.yaml` para deploy no Render.

Configuracao usada:

- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node

Tambem funciona em Railway com as mesmas variaveis de ambiente.

## Estrutura principal

```text
.
|-- index.js
|-- server.js
|-- src/
|   |-- database.js
|   |-- security.js
|   `-- validation.js
|-- index.test.js
|-- postman_collection.json
`-- render.yaml
```
