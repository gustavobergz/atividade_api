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

test("API permite criar 5 perifericos via POST", async () => {
  const novosPerifericos = [
    { nome: "Mouse Sem Fio", categoria: "mouse", preco: 90, estoque: 10 },
    {
      nome: "Teclado USB",
      categoria: "teclado",
      preco: 110,
      estoque: 7,
    },
    { nome: "Microfone", categoria: "audio", preco: 230, estoque: 5 },
    { nome: "Webcam Full HD", categoria: "video", preco: 180, estoque: 4 },
    {
      nome: "Mousepad RGB",
      categoria: "acessorio",
      preco: 70,
      estoque: 11,
    },
  ];

  for (const item of novosPerifericos) {
    const resposta = await fetch(`${baseUrl}/api/perifericos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    assert.equal(resposta.status, 201);
  }

  const respostaLista = await fetch(`${baseUrl}/api/perifericos`);
  const dadosLista = await respostaLista.json();

  assert.equal(respostaLista.status, 200);
  assert.equal(dadosLista.length, 10);
});
