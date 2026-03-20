# API de Perifericos

API simples feita em Node.js com Express, alinhada com o que aparece nas aulas 3 e 4:

- Aula 3: endpoints `GET`, busca por ID, filtro, ordenacao e paginacao
- Aula 4: endpoint `POST`, `express.json()`, geracao de ID e validacoes

## Como rodar

```bash
npm install
npm start
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
  "rotas": {
    "listar": "GET /api/perifericos",
    "filtrar": "GET /api/perifericos?categoria=mouse",
    "ordenar": "GET /api/perifericos?ordem=preco&direcao=asc",
    "paginar": "GET /api/perifericos?pagina=1&limite=2",
    "buscarPorId": "GET /api/perifericos/1",
    "criar": "POST /api/perifericos"
  }
}
```

### 2. GET /api/perifericos

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

### 3. GET /api/perifericos?categoria=mouse

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

### 4. GET /api/perifericos?ordem=preco&direcao=asc

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

### 5. GET /api/perifericos?pagina=1&limite=2

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

### 6. GET /api/perifericos/:id

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

### 7. POST /api/perifericos

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
- `GET http://localhost:3000/api/perifericos`
- `GET http://localhost:3000/api/perifericos?categoria=mouse`
- `GET http://localhost:3000/api/perifericos?ordem=preco&direcao=asc`
- `GET http://localhost:3000/api/perifericos?pagina=1&limite=2`
- `GET http://localhost:3000/api/perifericos/1`
- `POST http://localhost:3000/api/perifericos`

## Capturas de tela dos testes

As capturas de tela devem ser feitas no Postman depois de testar a collection no seu `localhost`. O arquivo `postman_collection.json` ja esta pronto para importar.
