// Работа с базой данных SQLite (встроенный модуль node:sqlite, без внешних зависимостей).
// Файл базы лежит в data/shop.db и не попадает в репозиторий.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'shop.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL CHECK (category IN ('fresh','smoked','salted')),
  description TEXT    NOT NULL DEFAULT '',
  price       INTEGER NOT NULL CHECK (price >= 0),
  unit        TEXT    NOT NULL DEFAULT 'кг' CHECK (unit IN ('кг','шт')),
  step        REAL    NOT NULL DEFAULT 0.5 CHECK (step > 0),
  min_qty     REAL    NOT NULL DEFAULT 0.5 CHECK (min_qty > 0),
  stock       REAL    NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image       TEXT    NOT NULL DEFAULT '',
  is_active   INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  status          TEXT    NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','confirmed','delivering','done','cancelled')),
  customer_name   TEXT    NOT NULL,
  phone           TEXT    NOT NULL,
  email           TEXT    NOT NULL DEFAULT '',
  delivery_method TEXT    NOT NULL CHECK (delivery_method IN ('courier','pickup')),
  address         TEXT    NOT NULL DEFAULT '',
  delivery_date   TEXT    NOT NULL DEFAULT '',
  delivery_time   TEXT    NOT NULL DEFAULT '',
  payment_method  TEXT    NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card')),
  comment         TEXT    NOT NULL DEFAULT '',
  admin_note      TEXT    NOT NULL DEFAULT '',
  items_total     INTEGER NOT NULL,
  delivery_cost   INTEGER NOT NULL,
  total           INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name       TEXT    NOT NULL,
  unit       TEXT    NOT NULL,
  price      INTEGER NOT NULL,
  qty        REAL    NOT NULL,
  sum        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

// Настройки по умолчанию (меняются в админ-панели)
const DEFAULT_SETTINGS = {
  shop_name: 'Shul.Fish',
  shop_phone: '+7 (900) 000-00-00',
  delivery_cost: '300',
  free_delivery_from: '5000',
  min_order: '1000',
  pickup_address: 'г. Москва, ул. Рыбная, д. 1',
  delivery_slots: '10:00–13:00\n13:00–16:00\n16:00–19:00\n19:00–22:00',
  delivery_note: 'Доставляем по городу ежедневно. Рыба упакована в термопакеты со льдом.',
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);

// Демонстрационные товары при первом запуске (можно удалить в админке)
const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
if (n === 0) {
  const seed = db.prepare(`INSERT INTO products (name, category, description, price, unit, step, min_qty, stock, image, sort)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const items = [
    ['Сёмга охлаждённая', 'fresh', 'Атлантическая сёмга, целая тушка, потрошёная с головой.', 1890, 'кг', 0.5, 1, 25, '/img/fresh.svg', 1],
    ['Судак свежий', 'fresh', 'Речной судак, вылов этой недели.', 790, 'кг', 0.5, 1, 15, '/img/fresh.svg', 2],
    ['Дорадо', 'fresh', 'Целая рыба 300–400 г, идеально для гриля.', 350, 'шт', 1, 1, 40, '/img/fresh.svg', 3],
    ['Скумбрия горячего копчения', 'smoked', 'Коптим на ольховой щепе, без жидкого дыма.', 690, 'кг', 0.5, 0.5, 20, '/img/smoked.svg', 4],
    ['Лещ холодного копчения', 'smoked', 'Классический лещ, вялено-копчёный.', 890, 'кг', 0.5, 0.5, 10, '/img/smoked.svg', 5],
    ['Палтус горячего копчения', 'smoked', 'Нежный жирный палтус, ломтики.', 1690, 'кг', 0.5, 0.5, 8, '/img/smoked.svg', 6],
    ['Сельдь слабосолёная', 'salted', 'Тихоокеанская сельдь, малосол по домашнему рецепту.', 490, 'кг', 0.5, 0.5, 30, '/img/salted.svg', 7],
    ['Форель слабосолёная', 'salted', 'Филе на коже, засолка 24 часа.', 2190, 'кг', 0.5, 0.5, 12, '/img/salted.svg', 8],
    ['Вобла вяленая', 'salted', 'Астраханская вобла, отборная.', 120, 'шт', 1, 1, 100, '/img/salted.svg', 9],
  ];
  for (const it of items) seed.run(...it);
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Выполняет fn в транзакции; при ошибке — откат.
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { db, getSettings, transaction, DEFAULT_SETTINGS };
