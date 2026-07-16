CREATE TABLE IF NOT EXISTS accounts (
  id           SERIAL PRIMARY KEY,
  owner        VARCHAR(255) NOT NULL,
  balance      BIGINT NOT NULL DEFAULT 0,
  currency     VARCHAR(3) NOT NULL DEFAULT 'PEN',
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT balance_no_negativo CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS transfers (
  id              SERIAL PRIMARY KEY,
  from_account    INTEGER NOT NULL REFERENCES accounts(id),
  to_account      INTEGER NOT NULL REFERENCES accounts(id),
  amount          BIGINT NOT NULL,
  reference       VARCHAR(80) UNIQUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT monto_positivo CHECK (amount > 0)
);
