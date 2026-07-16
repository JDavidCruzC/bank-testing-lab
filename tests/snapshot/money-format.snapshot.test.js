const { formatMoney, buildTransferReceipt } = require("../../src/services/money");

describe("Snapshot testing (formato y estructuras de salida)", () => {
  test("formatMoney con importe entero de soles", () => {
    expect(formatMoney(1050, "PEN")).toMatchInlineSnapshot(`"PEN 10.50"`);
  });

  test("formatMoney con importe menor a una unidad", () => {
    expect(formatMoney(5, "USD")).toMatchInlineSnapshot(`"USD 0.05"`);
  });

  test("formatMoney con importe exacto sin centimos", () => {
    expect(formatMoney(500000, "PEN")).toMatchInlineSnapshot(`"PEN 5000.00"`);
  });

  test("buildTransferReceipt genera la estructura esperada del recibo", () => {
    const receipt = buildTransferReceipt({
      id: 1,
      fromOwner: "Ana",
      toOwner: "Beto",
      amountCents: 3000,
      currency: "PEN",
      reference: "PAGO-01",
    });
    expect(receipt).toMatchInlineSnapshot(`
{
  "amount": "PEN 30.00",
  "receiptId": 1,
  "reference": "PAGO-01",
  "summary": "Ana -> Beto",
}
`);
  });

  test("buildTransferReceipt sin referencia usa el valor por defecto", () => {
    const receipt = buildTransferReceipt({
      id: 2,
      fromOwner: "Carla",
      toOwner: "Dora",
      amountCents: 10000,
      currency: "USD",
    });
    expect(receipt.reference).toMatchInlineSnapshot(`"SIN-REFERENCIA"`);
  });

  test("la forma del objeto de error HTTP se mantiene estable", () => {
    const errorBody = { error: "Fondos insuficientes" };
    expect(errorBody).toMatchInlineSnapshot(`
{
  "error": "Fondos insuficientes",
}
`);
  });

  test.todo(
    "capturar el snapshot del cuerpo de respuesta de POST /accounts usando property matchers para id y created_at"
  );

  test.todo(
    "capturar el snapshot de buildTransferReceipt para un monto con tres cifras de centimos redondeadas"
  );
});
