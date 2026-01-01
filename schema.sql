-- =========================
-- TABLA DE CUENTAS
-- =========================
CREATE TABLE IF NOT EXISTS cuentas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =========================
-- TABLA DE EVENTOS
-- =========================
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  cuenta_codigo TEXT NOT NULL,
  origen TEXT,
  lat REAL,
  lng REAL,
  fecha_evento TEXT NOT NULL,
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cuenta_codigo) REFERENCES cuentas(codigo)
);

-- =========================
-- ÍNDICES (PERFORMANCE)
-- =========================
CREATE INDEX IF NOT EXISTS idx_eventos_fecha
  ON eventos (fecha_evento DESC);

CREATE INDEX IF NOT EXISTS idx_eventos_cuenta
  ON eventos (cuenta_codigo);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo
  ON eventos (tipo);

-- =========================
-- API_KEYS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  key_hash TEXT NOT NULL,
  cuenta_codigo TEXT,
  activo INTEGER DEFAULT 1,
  creado_en TEXT
);
