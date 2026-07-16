const accounts = require("../services/accounts.service");

function pool(req) {
  return req.app.locals.pool;
}

async function create(req, res, next) {
  try {
    const account = await accounts.createAccount(pool(req), req.body);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const account = await accounts.getAccount(pool(req), req.params.id);
    if (!account) return res.status(404).json({ error: "Cuenta no encontrada" });
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    res.json(await accounts.listAccounts(pool(req)));
  } catch (err) {
    next(err);
  }
}

async function deposit(req, res, next) {
  try {
    const account = await accounts.deposit(
      pool(req),
      req.params.id,
      req.body.amountCents
    );
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function withdraw(req, res, next) {
  try {
    const account = await accounts.withdraw(
      pool(req),
      req.params.id,
      req.body.amountCents
    );
    res.json(account);
  } catch (err) {
    next(err);
  }
}

async function transfer(req, res, next) {
  try {
    const result = await accounts.transfer(pool(req), {
      fromId: req.body.fromId,
      toId: req.body.toId,
      amountCents: req.body.amountCents,
      reference: req.body.reference,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getOne, list, deposit, withdraw, transfer };
