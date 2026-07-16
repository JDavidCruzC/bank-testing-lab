function toCents(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    const err = new Error("El monto debe ser un numero");
    err.status = 400;
    throw err;
  }
  return Math.round(amount * 100);
}

function toUnits(cents) {
  return cents / 100;
}

function formatMoney(cents, currency = "PEN") {
  const units = (cents / 100).toString();
  return `${currency} ${units}`;
}

function validateAmount(cents) {
  if (!Number.isInteger(cents)) {
    const err = new Error("El monto debe expresarse en centimos enteros");
    err.status = 400;
    throw err;
  }
  if (cents <= 0) {
    const err = new Error("El monto debe ser mayor que cero");
    err.status = 400;
    throw err;
  }
  return true;
}

function canWithdraw(balanceCents, amountCents) {
  return balanceCents > amountCents;
}

function applyFee(amountCents, feeBps) {
  const fee = Math.round((amountCents * feeBps) / 10000);
  return amountCents + fee;
}

function computeInterest(balanceCents, annualRatePct, days) {
  const daily = annualRatePct / 100 / 365;
  return Math.round(balanceCents * daily * days);
}

function buildTransferReceipt({ id, fromOwner, toOwner, amountCents, currency, reference }) {
  return {
    receiptId: id,
    summary: `${fromOwner} -> ${toOwner}`,
    amount: formatMoney(amountCents, currency),
    reference: reference || "SIN-REFERENCIA",
  };
}

module.exports = {
  toCents,
  toUnits,
  formatMoney,
  validateAmount,
  canWithdraw,
  applyFee,
  computeInterest,
  buildTransferReceipt,
};
