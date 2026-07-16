const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body =
    res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, body };
}

async function nuevaCuenta(owner, deposito = 0) {
  const { body } = await api("/accounts", {
    method: "POST",
    body: JSON.stringify({ owner }),
  });
  if (deposito > 0) {
    await api(`/accounts/${body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: deposito }),
    });
  }
  return body.id;
}

describe("API bancaria (E2E contra el stack completo)", () => {
  test("el servicio responde en /health", async () => {
    const { status, body } = await api("/health");
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
  });

  test("flujo completo: crear, depositar, consultar saldo", async () => {
    const id = await nuevaCuenta("Lucia");

    const dep = await api(`/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 25000 }),
    });
    expect(dep.status).toBe(200);

    const consulta = await api(`/accounts/${id}`);
    expect(consulta.status).toBe(200);
    expect(Number(consulta.body.balance)).toBe(25000);
  });

  test("permite vaciar la cuenta transfiriendo el saldo completo", async () => {
    const origen = await nuevaCuenta("Omar", 4000);
    const destino = await nuevaCuenta("Pia", 0);

    const t = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({ fromId: origen, toId: destino, amountCents: 4000 }),
    });
    expect(t.status).toBe(201);

    const cOrigen = await api(`/accounts/${origen}`);
    expect(Number(cOrigen.body.balance)).toBe(0);
  });

  test("rechaza una transferencia a la misma cuenta", async () => {
    const id = await nuevaCuenta("Rita", 5000);

    const t = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({ fromId: id, toId: id, amountCents: 1000 }),
    });
    expect(t.status).toBe(400);

    const consulta = await api(`/accounts/${id}`);
    expect(Number(consulta.body.balance)).toBe(5000);
  });

  test("rechaza un deposito de monto cero", async () => {
    const id = await nuevaCuenta("Saul", 0);

    const dep = await api(`/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 0 }),
    });
    expect(dep.status).toBe(400);
  });

  test("una transferencia con referencia repetida no cobra dos veces al origen", async () => {
    const origen = await nuevaCuenta("Tomas", 10000);
    const destino = await nuevaCuenta("Uma", 0);

    await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: origen,
        toId: destino,
        amountCents: 2500,
        reference: "PAGO-UNICO",
      }),
    });
    await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: origen,
        toId: destino,
        amountCents: 2500,
        reference: "PAGO-UNICO",
      }),
    });

    const cOrigen = await api(`/accounts/${origen}`);
    expect(Number(cOrigen.body.balance)).toBe(7500);
  });

  test.todo(
    "una consulta a una cuenta inexistente responde con codigo 404"
  );

  test.todo(
    "un retiro por encima del saldo disponible responde con codigo 422 y no altera el saldo"
  );
});
