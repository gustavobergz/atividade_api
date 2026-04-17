const { createApp } = require("./index");

const PORT = Number(process.env.PORT || 3000);
const { app } = createApp();

app.listen(PORT, () => {
  console.log(`Biblioteca API rodando em http://localhost:${PORT}`);
});
