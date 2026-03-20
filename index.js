const express = require("express");

const app = express();
const PORT = 3000;
const ROTA_BASE = "/api/perifericos";

app.use(express.json());

function criarListaInicial() {
  return [
    {
      id: 1,
      nome: "Mouse Gamer",
      categoria: "mouse",
      preco: 150,
      estoque: 12,
    },
    {
      id: 2,
      nome: "Teclado Mecanico",
      categoria: "teclado",
      preco: 280,
      estoque: 8,
    },
    {
      id: 3,
      nome: "Headset USB",
      categoria: "audio",
      preco: 320,
      estoque: 15,
    },
    {
      id: 4,
      nome: "Webcam HD",
      categoria: "video",
      preco: 210,
      estoque: 6,
    },
    {
      id: 5,
      nome: "Mousepad RGB",
      categoria: "acessorio",
      preco: 70,
      estoque: 20,
    },
  ];
}

let perifericos = criarListaInicial();
let proximoId = 6;

function resetarDados() {
  perifericos = criarListaInicial();
  proximoId = 6;
}

app.get("/", (_req, res) => {
  res.json({
    mensagem: "API de perifericos funcionando.",
    status: "sucesso",
    timestamp: new Date().toISOString(),
    rotas: {
      me: "GET /api/me",
      data: "GET /api/data",
      random: "GET /api/random",
      listar: `GET ${ROTA_BASE}`,
      filtrar: `GET ${ROTA_BASE}?categoria=mouse`,
      ordenar: `GET ${ROTA_BASE}?ordem=preco&direcao=asc`,
      paginar: `GET ${ROTA_BASE}?pagina=1&limite=2`,
      buscarPorId: `GET ${ROTA_BASE}/1`,
      criar: `POST ${ROTA_BASE}`,
    },
  });
});

app.get("/api/me", (_req, res) => {
  res.json({
    nome: "Thiago Galvão",
    curso: "Ciência da Computação",
    hobbies: ["programar", "jogar", "testar API"],
    linguagens: ["JavaScript", "Python"],
  });
});

app.get("/api/data", (_req, res) => {
  res.json({
    data_hora: new Date().toISOString(),
  });
});

app.get("/api/random", (_req, res) => {
  res.json({
    numero: Math.floor(Math.random() * 100) + 1,
  });
});

app.get(ROTA_BASE, (req, res) => {
  const categoria = req.query.categoria;
  const ordem = req.query.ordem;
  const direcao = req.query.direcao || "asc";
  const pagina = Number(req.query.pagina || 1);
  const limite = Number(req.query.limite || 10);

  let resultado = [...perifericos];

  if (categoria) {
    resultado = resultado.filter((periferico) => {
      return (
        periferico.categoria.toLowerCase() === String(categoria).toLowerCase()
      );
    });
  }

  if (ordem === "preco") {
    resultado.sort((a, b) => {
      if (direcao === "desc") {
        return b.preco - a.preco;
      }

      return a.preco - b.preco;
    });
  }

  if (ordem === "nome") {
    resultado.sort((a, b) => {
      if (direcao === "desc") {
        return b.nome.localeCompare(a.nome);
      }

      return a.nome.localeCompare(b.nome);
    });
  }

  if (!req.query.pagina && !req.query.limite) {
    return res.json(resultado);
  }

  const inicio = (pagina - 1) * limite;
  const dadosPaginados = resultado.slice(inicio, inicio + limite);

  return res.json({
    dados: dadosPaginados,
    paginacao: {
      pagina_atual: pagina,
      itens_por_pagina: limite,
      total_itens: resultado.length,
      total_paginas: Math.ceil(resultado.length / limite),
    },
  });
});

app.get(`${ROTA_BASE}/:id`, (req, res) => {
  const id = Number(req.params.id);
  const periferico = perifericos.find((item) => item.id === id);

  if (!periferico) {
    return res.status(404).json({
      erro: "Periferico nao encontrado.",
    });
  }

  return res.json(periferico);
});

app.post(ROTA_BASE, (req, res) => {
  const nome = req.body.nome;
  const categoria = req.body.categoria;
  const preco = req.body.preco;
  const estoque = req.body.estoque ?? 0;

  if (!nome || !categoria || preco === undefined) {
    return res.status(400).json({
      erro: "Campos obrigatorios: nome, preco, categoria.",
    });
  }

  if (typeof nome !== "string" || nome.trim().length < 3) {
    return res.status(400).json({
      erro: "O nome deve ter pelo menos 3 caracteres.",
    });
  }

  if (typeof categoria !== "string" || categoria.trim().length < 3) {
    return res.status(400).json({
      erro: "A categoria deve ter pelo menos 3 caracteres.",
    });
  }

  if (typeof preco !== "number" || Number.isNaN(preco)) {
    return res.status(400).json({
      erro: "O preco deve ser um numero.",
    });
  }

  if (preco <= 0) {
    return res.status(400).json({
      erro: "O preco deve ser maior que zero.",
    });
  }

  if (typeof estoque !== "number" || Number.isNaN(estoque)) {
    return res.status(400).json({
      erro: "O estoque deve ser um numero.",
    });
  }

  if (estoque < 0) {
    return res.status(400).json({
      erro: "O estoque nao pode ser negativo.",
    });
  }

  const novoPeriferico = {
    id: proximoId,
    nome: nome.trim(),
    categoria: categoria.trim(),
    preco: preco,
    estoque: estoque,
  };

  proximoId = proximoId + 1;
  perifericos.push(novoPeriferico);

  return res.status(201).json(novoPeriferico);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
}

module.exports = { app, resetarDados };
