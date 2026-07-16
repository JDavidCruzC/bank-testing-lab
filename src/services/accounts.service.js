const { validateAmount, canWithdraw } = require("./money");

async function createAccount(pool, { owner, currency } = {}) {
  if (!owner || typeof owner !== "string" || !owner.trim()) {
    const err = new Error("El titular es obligatorio");
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    "INSERT INTO accounts (owner, currency) VALUES ($1, $2) " +
      "RETURNING id, owner, balance, currency, status, created_at",
    [owner.trim(), currency || "PEN"]
  );

  return rows[0];
}

async function getAccount(pool, id) {
  const { rows } = await pool.query(
    "SELECT id, owner, balance, currency, status, created_at " +
      "FROM accounts WHERE id = $1",
    [id]
  );

  return rows[0] || null;
}

/* ========= CAMBIO 1 =========
   Se modificó el ORDER BY de DESC a ASC para cumplir con
   el orden esperado por las pruebas de integración.
*/
async function listAccounts(pool) {
  const { rows } = await pool.query(
    "SELECT id, owner, balance, currency, status, created_at " +
      "FROM accounts ORDER BY id ASC"
  );

  return rows;
}

async function deposit(pool, id, amountCents) {
  validateAmount(amountCents);

  const { rows } = await pool.query(
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2 " +
      "RETURNING id, owner, balance, currency, status",
    [amountCents, id]
  );

  if (rows.length === 0) {
    const err = new Error("Cuenta no encontrada");
    err.status = 404;
    throw err;
  }

  return rows[0];
}

async function withdraw(pool, id, amountCents) {
  validateAmount(amountCents);

  const account = await getAccount(pool, id);

  if (!account) {
    const err = new Error("Cuenta no encontrada");
    err.status = 404;
    throw err;
  }

  if (!canWithdraw(Number(account.balance), amountCents)) {
    const err = new Error("Fondos insuficientes");
    err.status = 422;
    throw err;
  }

  const nuevoSaldo = Number(account.balance) - amountCents;

  await pool.query(
    "UPDATE accounts SET balance = $1 WHERE id = $2",
    [nuevoSaldo, id]
  );

  return {
    ...account,
    balance: nuevoSaldo,
  };
}

/* ========= CAMBIO 2 =========
   Se implementó una transacción para asegurar la atomicidad
   de la transferencia.

   Si ocurre un error (por ejemplo, una referencia duplicada),
   se ejecuta ROLLBACK y ningún saldo es modificado.
*/
async function transfer(pool, { fromId, toId, amountCents, reference } = {}) {
  validateAmount(amountCents);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const from = await client.query(
      "SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE",
      [fromId]
    );

    const to = await client.query(
      "SELECT id FROM accounts WHERE id = $1 FOR UPDATE",
      [toId]
    );

    if (from.rows.length === 0 || to.rows.length === 0) {
      const err = new Error("Cuenta de origen o destino no encontrada");
      err.status = 404;
      throw err;
    }

    if (!canWithdraw(Number(from.rows[0].balance), amountCents)) {
      const err = new Error("Fondos insuficientes");
      err.status = 422;
      throw err;
    }

    // Primero se registra la transferencia.
    // Si la referencia ya existe, aquí fallará y se hará rollback.
    const { rows } = await client.query(
      "INSERT INTO transfers (from_account, to_account, amount, reference) " +
        "VALUES ($1, $2, $3, $4) " +
        "RETURNING id, from_account, to_account, amount, reference, created_at",
      [fromId, toId, amountCents, reference || null]
    );

    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amountCents, fromId]
    );

    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amountCents, toId]
    );

    await client.query("COMMIT");

    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createAccount,
  getAccount,
  listAccounts,
  deposit,
  withdraw,
  transfer,
};