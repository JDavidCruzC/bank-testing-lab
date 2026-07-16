const request = require("supertest");
const { Pool } = require("pg");
const { createApp } = require("../../src/app");

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://bankuser:bankpass@localhost:5433/bankdb_test";

let pool;
let app;

beforeAll(() => {
  pool = new Pool({ connectionString: TEST_DATABASE_URL });
  app = createApp(pool);
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE transfers, accounts RESTART IDENTITY CASCADE");
});

async function crearCuenta(owner, saldoInicial = 0) {
  const res = await request(app).post("/accounts").send({ owner });
  if (saldoInicial > 0) {
    await request(app)
      .post(`/accounts/${res.body.id}/deposit`)
      .send({ amountCents: saldoInicial });
  }
  return res.body.id;
}

describe("Cuentas y saldos (integracion con Postgres real)", () => {
  test("crea una cuenta con saldo inicial cero", async () => {
    const res = await request(app).post("/accounts").send({ owner: "Ana" });
    expect(res.status).toBe(201);
    expect(Number(res.body.balance)).toBe(0);
  });

  test("un deposito incrementa el saldo persistido", async () => {
    const id = await crearCuenta("Beto");
    const res = await request(app)
      .post(`/accounts/${id}/deposit`)
      .send({ amountCents: 15000 });

    expect(res.status).toBe(200);
    expect(Number(res.body.balance)).toBe(15000);

    const { rows } = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1",
      [id]
    );
    expect(Number(rows[0].balance)).toBe(15000);
  });

  test("permite retirar exactamente el saldo total de la cuenta", async () => {
    const id = await crearCuenta("Carla", 5000);
    const res = await request(app)
      .post(`/accounts/${id}/withdraw`)
      .send({ amountCents: 5000 });

    expect(res.status).toBe(200);
    expect(Number(res.body.balance)).toBe(0);
  });

  test("una transferencia rechazada por referencia duplicada no debita el origen", async () => {
    const origen = await crearCuenta("Fito", 10000);
    const destino = await crearCuenta("Gina", 0);

    await request(app).post("/transfers").send({
      fromId: origen,
      toId: destino,
      amountCents: 2000,
      reference: "NOMINA-01",
    });

    await request(app).post("/transfers").send({
      fromId: origen,
      toId: destino,
      amountCents: 2000,
      reference: "NOMINA-01",
    });

    const { rows } = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1",
      [origen]
    );
    expect(Number(rows[0].balance)).toBe(8000);
  });

  test("rechaza una transferencia por fondos insuficientes sin mover dinero", async () => {
    const origen = await crearCuenta("Hugo", 1000);
    const destino = await crearCuenta("Ivy", 0);

    const res = await request(app).post("/transfers").send({
      fromId: origen,
      toId: destino,
      amountCents: 5000,
    });
    expect(res.status).toBe(422);

    const { rows } = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1",
      [origen]
    );
    expect(Number(rows[0].balance)).toBe(1000);
  });

  test("GET /accounts devuelve las cuentas ordenadas de forma ascendente por id", async () => {
    await crearCuenta("Primera");
    await crearCuenta("Segunda");
    await crearCuenta("Tercera");

    const res = await request(app).get("/accounts");
    expect(res.status).toBe(200);

    const ids = res.body.map((c) => c.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  test.todo(
    "GET /accounts/:id de una cuenta inexistente responde con codigo 404"
  );

  test.todo(
    "un deposito con amountCents decimal (por ejemplo 100.5) es rechazado con codigo 400"
  );
});
