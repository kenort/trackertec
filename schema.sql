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
  role TEXT DEFAULT 'read' CHECK(role IN ('admin', 'write', 'read')),
  activo INTEGER DEFAULT 1,
  creado_en TEXT
);

-- =========================
-- RATE LIMITING TABLE
-- =========================

CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_timestamp
  ON rate_limits (api_key_id, timestamp);

-- =========================
-- NOTIFICATIONS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  tipo TEXT DEFAULT 'info' CHECK(tipo IN ('info', 'warning', 'error', 'critical')),
  evento_id TEXT,
  leida INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cuenta_codigo) REFERENCES cuentas(codigo)
);

CREATE INDEX IF NOT EXISTS idx_notifications_cuenta
  ON notifications (cuenta_codigo);

CREATE INDEX IF NOT EXISTS idx_notifications_leida
  ON notifications (leida);

-- =========================
-- ANALYTICS TABLE
-- =========================

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_codigo TEXT NOT NULL,
  evento_tipo TEXT,
  fecha_hora TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  FOREIGN KEY (cuenta_codigo) REFERENCES cuentas(codigo)
);

CREATE INDEX IF NOT EXISTS idx_analytics_cuenta_fecha
  ON analytics (cuenta_codigo, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_tipo
  ON analytics (evento_tipo);
