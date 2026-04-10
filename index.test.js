const test = require("node:test");
const assert = require("node:assert/strict");
const { app, resetarDados } = require("./index");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => {
    server.on("listening", resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.beforeEach(() => {
  resetarDados();
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((erro) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve();
    });
  });
});

test("GET / retorna informacoes da API", async () => {
  const resposta = await fetch(`${baseUrl}/`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.status, "sucesso");
  assert.equal(dados.rotas.atualizar, "PUT /api/perifericos/1");
  assert.equal(dados.rotas.remover, "DELETE /api/perifericos/1");
});

test("GET /api/me retorna dados fixos", async () => {
  const resposta = await fetch(`${baseUrl}/api/me`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.nome, "Thiago Galtra");
  assert.ok(Array.isArray(dados.hobbies));
});

test("GET /api/data retorna uma data ISO", async () => {
  const resposta = await fetch(`${baseUrl}/api/data`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.ok(!Number.isNaN(Date.parse(dados.data_hora)));
});

test("GET /api/random retorna numero entre 1 e 100", async () => {
  const resposta = await fetch(`${baseUrl}/api/random`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(typeof dados.numero, "number");
  assert.ok(dados.numero >= 1 && dados.numero <= 100);
});

test("GET /perifericos retorna a lista inicial", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.length, 5);
  assert.equal(dados[0].estoque, 12);
});

test("GET /perifericos filtra por categoria", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos?categoria=mouse`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.length, 1);
  assert.equal(dados[0].categoria, "mouse");
});

test("GET /api/perifericos ordena por preco", async () => {
  const resposta = await fetch(
    `${baseUrl}/api/perifericos?ordem=preco&direcao=asc`
  );
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados[0].nome, "Mousepad RGB");
});

test("GET /api/perifericos pagina resultados", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos?pagina=1&limite=2`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.dados.length, 2);
  assert.equal(dados.paginacao.pagina_atual, 1);
  assert.equal(dados.paginacao.total_itens, 5);
});

test("GET /perifericos/:id retorna um periferico", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/1`);
  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.id, 1);
  assert.equal(dados.nome, "Mouse Gamer");
});

test("POST /perifericos cria um novo periferico", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Caixa de Som Bluetooth",
      categoria: "audio",
      preco: 450,
      estoque: 9,
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 201);
  assert.equal(dados.id, 6);
  assert.equal(dados.nome, "Caixa de Som Bluetooth");
  assert.equal(dados.preco, 450);
});

test("POST /perifericos exige nome e categoria", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Produto sem categoria",
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.erro, "Campos obrigatorios: nome, preco, categoria.");
});

test("POST /perifericos valida preco invalido", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Mouse com preco ruim",
      categoria: "mouse",
      preco: -20,
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.erro, "O preco deve ser maior que zero.");
});

test("PUT /perifericos/:id atualiza um periferico existente", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Teclado Mecanico RGB",
      categoria: "teclado",
      preco: 320,
      estoque: 10,
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(dados.id, 2);
  assert.equal(dados.nome, "Teclado Mecanico RGB");
  assert.equal(dados.preco, 320);
  assert.equal(dados.estoque, 10);
});

test("PUT /perifericos/:id retorna 404 para item inexistente", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/999`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Produto Fantasma",
      categoria: "audio",
      preco: 150,
      estoque: 1,
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 404);
  assert.equal(dados.erro, "Periferico nao encontrado.");
});

test("PUT /perifericos/:id valida campos obrigatorios", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: "Mouse Atualizado",
      preco: 199,
    }),
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 400);
  assert.equal(dados.erro, "Campos obrigatorios: nome, preco, categoria.");
});

test("DELETE /perifericos/:id remove um periferico", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/3`, {
    method: "DELETE",
  });

  assert.equal(resposta.status, 204);

  const respostaLista = await fetch(`${baseUrl}/api/perifericos`);
  const dadosLista = await respostaLista.json();

  assert.equal(dadosLista.length, 4);
  assert.equal(dadosLista.some((item) => item.id === 3), false);
});

test("DELETE /perifericos/:id retorna 404 para item inexistente", async () => {
  const resposta = await fetch(`${baseUrl}/api/perifericos/999`, {
    method: "DELETE",
  });

  const dados = await resposta.json();

  assert.equal(resposta.status, 404);
  assert.equal(dados.erro, "Periferico nao encontrado.");
});
