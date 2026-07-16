const express = require("express");
const router = require("./routes/accounts.routes");

function createApp(pool) {
  const app = express();
  app.use(express.json());
  app.locals.pool = pool;

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/", router);

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Error interno" });
  });

  return app;
}

module.exports = { createApp };
