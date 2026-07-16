require("dotenv").config();
const { createApp } = require("./app");
const { createPool } = require("./db");

const pool = createPool();
const app = createApp(pool);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor bancario escuchando en el puerto ${PORT}`);
});
