# API de Perifericos

API simples feita em Node.js com Express, alinhada com o que aparece nas aulas 1, 2, 3 e 4:

- Aula 1: principios REST, URIs em plural e JSON
- Aula 2: setup do ambiente, primeira API, Postman e scripts npm
- Aula 3: endpoints `GET`, busca por ID, filtro, ordenacao e paginacao
- Aula 4: endpoint `POST`, `express.json()`, geracao de ID e validacoes

## Setup do ambiente

Segundo as aulas iniciais, o ambiente minimo fica assim:

- Node.js instalado
- npm funcionando
- Postman instalado
- Git configurado

## Como rodar

```bash
npm install
npm start
```

Para desenvolvimento com reinicio automatico:

```bash
npm run dev
```

Servidor:

```text
http://localhost:3000
```

## Lista de todos os endpoints

### 1. GET /

Metodo:

```http
GET /
```

URL completa:

```http
http://localhost:3000/
```

Body:

```json
{}
```

Resposta esperada:

```json
{
    "mensagem": "API de perifericos funcionando.",
    "status": "sucesso",
    "timestamp": "2026-03-20T00:00:00.000Z",
    "rotas": {
      "me": "GET /api/me",
      "data": "GET /api/data",
      "random": "GET /api/random",
      "listar": "GET /api/perifericos",
      "filtrar": "GET /api/perifericos?categoria=mouse",
      "ordenar": "GET /api/perifericos?ordem=preco&direcao=asc",
    "paginar": "GET /api/perifericos?pagina=1&limite=2",
    "buscarPorId": "GET /api/perifericos/1",
    "criar": "POST /api/perifericos"
  }
}
```

### 2. GET /api/me

Metodo:

```http
GET /api/me
```

URL completa:

```http
http://localhost:3000/api/me
```

Body:

```json
{}
```

Resposta esperada:

```json
{
  "nome": "Thiago Galtra",
  "profissao": "Professor/Empresario",
  "hobbies": ["programar", "jogar", "testar API"],
  "linguagens": ["JavaScript", "Python"]
}
```

### 3. GET /api/data

Metodo:

```http
GET /api/data
```

URL completa:

```http
http://localhost:3000/api/data
```

Body:

```json
{}
```

Resposta esperada:

```json
{
  "data_hora": "2026-03-20T00:00:00.000Z"
}
```

### 4. GET /api/random

Metodo:

```http
GET /api/random
```

URL completa:

```http
http://localhost:3000/api/random
```

Body:

```json
{}
```

Resposta esperada:

```json
{
  "numero": 42
}
```

### 5. GET /api/perifericos

Metodo:

```http
GET /api/perifericos
```

URL completa:

```http
http://localhost:3000/api/perifericos
```

Body:

```json
{}
```

Resposta esperada:

```json
[
  {
    "id": 1,
    "nome": "Mouse Gamer",
    "categoria": "mouse",
    "preco": 150,
    "estoque": 12
  }
]
```

### 6. GET /api/perifericos?categoria=mouse

Metodo:

```http
GET /api/perifericos?categoria=mouse
```

URL completa:

```http
http://localhost:3000/api/perifericos?categoria=mouse
```

Body:

```json
{}
```

Resposta esperada:

```json
[
  {
    "id": 1,
    "nome": "Mouse Gamer",
    "categoria": "mouse",
    "preco": 150,
    "estoque": 12
  }
]
```

### 7. GET /api/perifericos?ordem=preco&direcao=asc

Metodo:

```http
GET /api/perifericos?ordem=preco&direcao=asc
```

URL completa:

```http
http://localhost:3000/api/perifericos?ordem=preco&direcao=asc
```

Body:

```json
{}
```

Resposta esperada:

```json
[
  {
    "id": 5,
    "nome": "Mousepad RGB",
    "categoria": "acessorio",
    "preco": 70,
    "estoque": 20
  }
]
```

### 8. GET /api/perifericos?pagina=1&limite=2

Metodo:

```http
GET /api/perifericos?pagina=1&limite=2
```

URL completa:

```http
http://localhost:3000/api/perifericos?pagina=1&limite=2
```

Body:

```json
{}
```

Resposta esperada:

```json
{
  "dados": [
    {
      "id": 1,
      "nome": "Mouse Gamer",
      "categoria": "mouse",
      "preco": 150,
      "estoque": 12
    },
    {
      "id": 2,
      "nome": "Teclado Mecanico",
      "categoria": "teclado",
      "preco": 280,
      "estoque": 8
    }
  ],
  "paginacao": {
    "pagina_atual": 1,
    "itens_por_pagina": 2,
    "total_itens": 5,
    "total_paginas": 3
  }
}
```

### 9. GET /api/perifericos/:id

Metodo:

```http
GET /api/perifericos/1
```

URL completa:

```http
http://localhost:3000/api/perifericos/1
```

Body:

```json
{}
```

Resposta esperada:

```json
{
  "id": 1,
  "nome": "Mouse Gamer",
  "categoria": "mouse",
  "preco": 150,
  "estoque": 12
}
```

Resposta se nao encontrar:

```json
{
  "erro": "Periferico nao encontrado."
}
```

### 10. POST /api/perifericos

Metodo:

```http
POST /api/perifericos
```

URL completa:

```http
http://localhost:3000/api/perifericos
```

Body:

```json
{
  "nome": "Caixa de Som Bluetooth",
  "categoria": "audio",
  "preco": 450,
  "estoque": 9
}
```

Resposta esperada:

```json
{
  "id": 6,
  "nome": "Caixa de Som Bluetooth",
  "categoria": "audio",
  "preco": 450,
  "estoque": 9
}
```

## Exemplos de requisicao no Postman

Collection salva no arquivo:

`postman_collection.json`

Requisicoes prontas na collection:

- `GET /`
- `GET /api/me`
- `GET /api/data`
- `GET /api/random`
- `GET /api/perifericos`
- `GET /api/perifericos?categoria=mouse`
- `GET /api/perifericos?ordem=preco&direcao=asc`
- `GET /api/perifericos?pagina=1&limite=2`
- `GET /api/perifericos/1`
- `POST 1 - Mouse Sem Fio`
- `POST 2 - Teclado USB`
- `POST 3 - Microfone`
- `POST 4 - Webcam Full HD`
- `POST 5 - Mousepad RGB`
- `POST invalido`

## 5 recursos criados via POST

Os 5 exemplos de criacao via POST estao na collection:

```json
[
  {
    "nome": "Mouse Sem Fio",
    "categoria": "mouse",
    "preco": 90,
    "estoque": 10
  },
  {
    "nome": "Teclado USB",
    "categoria": "teclado",
    "preco": 110,
    "estoque": 7
  },
  {
    "nome": "Microfone",
    "categoria": "audio",
    "preco": 230,
    "estoque": 5
  },
  {
    "nome": "Webcam Full HD",
    "categoria": "video",
    "preco": 180,
    "estoque": 4
  },
  {
    "nome": "Mousepad RGB",
    "categoria": "acessorio",
    "preco": 70,
    "estoque": 11
  }
]
```

## Explicacao das validacoes implementadas

No `POST /api/perifericos`, a API valida:

- `nome` obrigatorio
- `categoria` obrigatoria
- `preco` obrigatorio
- `estoque` numerico quando enviado
- `nome` com pelo menos 3 caracteres
- `categoria` com pelo menos 3 caracteres
- `preco` deve ser numero
- `preco` deve ser maior que zero
- `estoque` nao pode ser negativo

Tambem usei `express.json()` para ler o body JSON e `proximoId` para gerar IDs automaticamente, exatamente no estilo mostrado na aula 4.

Exemplo de erro:

```json
{
  "erro": "Campos obrigatorios: nome, preco, categoria."
}
```

## Testes manuais no localhost

Para rodar a API localmente:

```bash
npm install
npm start
```

Depois disso, teste manualmente no Postman usando:

- `GET http://localhost:3000/`
- `GET http://localhost:3000/api/me`
- `GET http://localhost:3000/api/data`
- `GET http://localhost:3000/api/random`
- `GET http://localhost:3000/api/perifericos`
- `GET http://localhost:3000/api/perifericos?categoria=mouse`
- `GET http://localhost:3000/api/perifericos?ordem=preco&direcao=asc`
- `GET http://localhost:3000/api/perifericos?pagina=1&limite=2`
- `GET http://localhost:3000/api/perifericos/1`
- `POST http://localhost:3000/api/perifericos`

## Capturas de tela dos testes

As capturas de tela devem ser feitas no Postman depois de testar a collection no seu `localhost`. O arquivo `postman_collection.json` ja esta pronto para importar.
