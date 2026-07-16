const path = require("path");
const { Verifier } = require("@pact-foundation/pact");
const { createApp } = require("../../../src/app");
const { createPool } = require("../../../src/db");

const PORT = 3100;
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://bankuser:bankpass@localhost:5433/bankdb_test";

describe("Verificacion del proveedor ApiCuentasBancarias contra el contrato Pact", () => {
  let server;
  let pool;

  beforeAll(async () => {
    pool = createPool(TEST_DATABASE_URL);
    await pool.query("TRUNCATE TABLE transfers, accounts RESTART IDENTITY CASCADE");
    await pool.query(
      "INSERT INTO accounts (id, owner, balance) VALUES (1, 'ClienteMovil', 1500)"
    );
    await pool.query(
      "INSERT INTO accounts (id, owner, balance) VALUES (2, 'Destino', 0)"
    );
    await pool.query(
      "SELECT setval('accounts_id_seq', (SELECT MAX(id) FROM accounts))"
    );
    const app = createApp(pool);
    server = app.listen(PORT);
  });

  afterAll(async () => {
    await pool.end();
    server.close();
  });

  test("cumple todas las interacciones definidas por el consumidor", () => {
    const verifier = new Verifier({
      provider: "ApiCuentasBancarias",
      providerBaseUrl: `http://localhost:${PORT}`,
      pactUrls: [
        path.resolve(
          process.cwd(),
          "pacts",
          "AppMovilBanco-ApiCuentasBancarias.json"
        ),
      ],
      stateHandlers: {
        "no existen precondiciones": () => Promise.resolve(),
        "la cuenta 1 existe con saldo 1500": () => Promise.resolve(),
        "la cuenta 999 no existe": () => Promise.resolve(),
        "la cuenta 1 tiene saldo suficiente y la cuenta 2 existe": () =>
          Promise.resolve(),
        "la cuenta 1 tiene saldo insuficiente": () => Promise.resolve(),
        "la cuenta 1 existe": () => Promise.resolve(),
      },
    });

    return verifier.verifyProvider();
  });
});
