const path = require("path");
const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like, integer, string } = MatchersV3;

const provider = new PactV3({
  consumer: "AppMovilBanco",
  provider: "ApiCuentasBancarias",
  dir: path.resolve(process.cwd(), "pacts"),
});

describe("Contrato: AppMovilBanco consume ApiCuentasBancarias", () => {
  test("POST /accounts crea una cuenta y devuelve su representacion", async () => {
    provider
      .given("no existen precondiciones")
      .uponReceiving("una solicitud para crear una cuenta")
      .withRequest({
        method: "POST",
        path: "/accounts",
        headers: { "Content-Type": "application/json" },
        body: { owner: "ClienteMovil" },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: {
          id: integer(1),
          owner: string("ClienteMovil"),
          balance: integer(0),
          currency: string("PEN"),
          status: string("active"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: "ClienteMovil" }),
      });
      expect(res.status).toBe(201);
    });
  });

  test("GET /accounts/:id devuelve la cuenta solicitada", async () => {
    provider
      .given("la cuenta 1 existe con saldo 1500")
      .uponReceiving("una solicitud para consultar la cuenta 1")
      .withRequest({ method: "GET", path: "/accounts/1" })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: {
          id: integer(1),
          owner: string("ClienteMovil"),
          balance: integer(1500),
          currency: string("PEN"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/accounts/1`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.balance).toBe(1500);
    });
  });

  test("GET /accounts/:id sobre una cuenta inexistente responde 404", async () => {
    provider
      .given("la cuenta 999 no existe")
      .uponReceiving("una solicitud para consultar la cuenta 999")
      .withRequest({ method: "GET", path: "/accounts/999" })
      .willRespondWith({
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { error: like("Cuenta no encontrada") },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/accounts/999`);
      expect(res.status).toBe(404);
    });
  });

  test("POST /transfers ejecuta una transferencia valida", async () => {
    provider
      .given("la cuenta 1 tiene saldo suficiente y la cuenta 2 existe")
      .uponReceiving("una solicitud de transferencia valida")
      .withRequest({
        method: "POST",
        path: "/transfers",
        headers: { "Content-Type": "application/json" },
        body: { fromId: 1, toId: 2, amountCents: 500 },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: {
          id: integer(1),
          from_account: integer(1),
          to_account: integer(2),
          amount: integer(500),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: 1, toId: 2, amountCents: 500 }),
      });
      expect(res.status).toBe(201);
    });
  });

  test("POST /transfers con fondos insuficientes responde 422", async () => {
    provider
      .given("la cuenta 1 tiene saldo insuficiente")
      .uponReceiving("una solicitud de transferencia con fondos insuficientes")
      .withRequest({
        method: "POST",
        path: "/transfers",
        headers: { "Content-Type": "application/json" },
        body: { fromId: 1, toId: 2, amountCents: 999999 },
      })
      .willRespondWith({
        status: 422,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { error: like("Fondos insuficientes") },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: 1, toId: 2, amountCents: 999999 }),
      });
      expect(res.status).toBe(422);
    });
  });

  test("POST /transfers hacia la misma cuenta responde 400", async () => {
    provider
      .given("la cuenta 1 existe")
      .uponReceiving("una solicitud de transferencia de la cuenta 1 a si misma")
      .withRequest({
        method: "POST",
        path: "/transfers",
        headers: { "Content-Type": "application/json" },
        body: { fromId: 1, toId: 1, amountCents: 100 },
      })
      .willRespondWith({
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: { error: like("No se puede transferir a la misma cuenta") },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: 1, toId: 1, amountCents: 100 }),
      });
      expect(res.status).toBe(400);
    });
  });

  test.todo(
    "POST /accounts/:id/deposit con un monto valido responde 200 y el saldo actualizado"
  );

  test.todo(
    "GET /accounts responde 200 con un arreglo de cuentas"
  );
});
