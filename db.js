// Работа с базой данных SQLite (встроенный модуль node:sqlite, без внешних зависимостей).
// Файл базы лежит в data/shop.db и не попадает в репозиторий.
//
// Деньги хранятся в грошах (целое число): 1 zł = 100 gr.
// Многоязычные тексты (название, описание товара, описание доставки) хранятся как JSON: {"pl": "...", "en": "...", "ru": "...", "uk": "..."}.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const LANGS = ['pl', 'en', 'ru', 'uk'];
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'shop.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,              -- JSON по языкам
  category    TEXT    NOT NULL CHECK (category IN ('fresh','smoked','salted')),
  description TEXT    NOT NULL DEFAULT '{}', -- JSON по языкам
  price       INTEGER NOT NULL CHECK (price >= 0), -- грош за единицу
  unit        TEXT    NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','pcs')),
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
  lang            TEXT    NOT NULL DEFAULT 'pl', -- язык, на котором клиент оформил заказ
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
  items_total     INTEGER NOT NULL, -- грош
  delivery_cost   INTEGER NOT NULL, -- грош
  total           INTEGER NOT NULL  -- грош
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name       TEXT    NOT NULL, -- JSON по языкам (снимок на момент заказа)
  unit       TEXT    NOT NULL,
  price      INTEGER NOT NULL, -- грош
  qty        REAL    NOT NULL,
  sum        INTEGER NOT NULL  -- грош
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Покупатели с личным кабинетом. Пароль хранится только в виде хеша scrypt.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL DEFAULT '',
  phone         TEXT    NOT NULL DEFAULT '',
  address       TEXT    NOT NULL DEFAULT '',
  session_ver   INTEGER NOT NULL DEFAULT 1, -- увеличивается при смене пароля, чтобы выкинуть старые сессии
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Сообщения из формы обратной связи
CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lang       TEXT    NOT NULL DEFAULT 'pl',
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  phone      TEXT    NOT NULL DEFAULT '',
  message    TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new','done')),
  admin_note TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

// Миграция: привязка заказа к покупателю (для баз, созданных до появления личного кабинета)
if (!db.prepare('PRAGMA table_info(orders)').all().some((c) => c.name === 'user_id')) {
  db.exec('ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)');

// Настройки по умолчанию (меняются в админ-панели). Суммы — в грошах.
const DEFAULT_SETTINGS = {
  shop_name: 'Shul.Fish',
  shop_phone: '+48 500 000 000',
  delivery_cost: '1500',
  free_delivery_from: '25000',
  min_order: '5000',
  pickup_address: 'ul. Rybna 1, 00-001 Warszawa',
  delivery_slots: '10:00–13:00\n13:00–16:00\n16:00–19:00\n19:00–22:00',
  // Реквизиты продавца (публичные данные из CEIDG) — показываются в подвале сайта и в политике конфиденциальности
  company_name: 'Oleh Shuliak SHUL-FISH',
  company_address: 'ul. Żurawia 47/49 lok. 4, 00-680 Warszawa',
  company_nip: '1251791175',
  company_regon: '542299723',
  contact_email: '',
  delivery_note: JSON.stringify({
    pl: 'Dostarczamy codziennie na terenie miasta. Ryby pakujemy w torby termiczne z lodem.',
    en: 'We deliver daily within the city. Fish is packed in thermal bags with ice.',
    ru: 'Доставляем по городу ежедневно. Рыба упакована в термопакеты со льдом.',
    uk: 'Доставляємо містом щодня. Рибу пакуємо в термопакети з льодом.',
  }),
};
const MONEY_SETTINGS = ['delivery_cost', 'free_delivery_from', 'min_order'];
const I18N_SETTINGS = ['delivery_note'];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);
// Незаполненные реквизиты в существующей базе заполняем значениями по умолчанию
const fillEmpty = db.prepare("UPDATE settings SET value = ? WHERE key = ? AND value = ''");
for (const k of ['company_name', 'company_address', 'company_nip', 'company_regon']) fillEmpty.run(DEFAULT_SETTINGS[k], k);

// Демонстрационные товары при первом запуске (можно удалить в админке)
const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
if (n === 0) {
  const seed = db.prepare(`INSERT INTO products (name, category, description, price, unit, step, min_qty, stock, image, sort)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const L = (pl, en, ru, uk) => JSON.stringify({ pl, en, ru, uk });
  const items = [
    [L('Łosoś świeży', 'Fresh salmon', 'Сёмга охлаждённая', 'Лосось охолоджений'), 'fresh',
      L('Łosoś atlantycki, cała tuszka, patroszony.', 'Atlantic salmon, whole, gutted.', 'Атлантическая сёмга, целая тушка, потрошёная.', 'Атлантичний лосось, ціла тушка, патрана.'),
      8990, 'kg', 0.5, 1, 25, '/img/fresh.svg', 1],
    [L('Sandacz świeży', 'Fresh zander', 'Судак свежий', 'Судак свіжий'), 'fresh',
      L('Sandacz rzeczny, połów z tego tygodnia.', 'River zander, caught this week.', 'Речной судак, вылов этой недели.', 'Річковий судак, вилов цього тижня.'),
      5490, 'kg', 0.5, 1, 15, '/img/fresh.svg', 2],
    [L('Dorada', 'Sea bream', 'Дорадо', 'Дорадо'), 'fresh',
      L('Cała ryba 300–400 g, idealna na grilla.', 'Whole fish 300–400 g, perfect for grilling.', 'Целая рыба 300–400 г, идеально для гриля.', 'Ціла риба 300–400 г, ідеально для гриля.'),
      1990, 'pcs', 1, 1, 40, '/img/fresh.svg', 3],
    [L('Makrela wędzona na gorąco', 'Hot-smoked mackerel', 'Скумбрия горячего копчения', 'Скумбрія гарячого копчення'), 'smoked',
      L('Wędzona na zrębkach olchowych, bez dymu w płynie.', 'Smoked over alder chips, no liquid smoke.', 'Коптим на ольховой щепе, без жидкого дыма.', 'Коптимо на вільховій трісці, без рідкого диму.'),
      3990, 'kg', 0.5, 0.5, 20, '/img/smoked.svg', 4],
    [L('Leszcz wędzony na zimno', 'Cold-smoked bream', 'Лещ холодного копчения', 'Лящ холодного копчення'), 'smoked',
      L('Klasyczny leszcz, suszony i wędzony.', 'Classic dried and smoked bream.', 'Классический лещ, вялено-копчёный.', 'Класичний лящ, в’ялено-копчений.'),
      4990, 'kg', 0.5, 0.5, 10, '/img/smoked.svg', 5],
    [L('Halibut wędzony na gorąco', 'Hot-smoked halibut', 'Палтус горячего копчения', 'Палтус гарячого копчення'), 'smoked',
      L('Delikatny, tłusty halibut w plastrach.', 'Tender, rich halibut slices.', 'Нежный жирный палтус, ломтики.', 'Ніжний жирний палтус, скибочки.'),
      9990, 'kg', 0.5, 0.5, 8, '/img/smoked.svg', 6],
    [L('Śledź lekko solony', 'Lightly salted herring', 'Сельдь слабосолёная', 'Оселедець слабосолений'), 'salted',
      L('Śledź pacyficzny według domowej receptury.', 'Pacific herring, home-style recipe.', 'Тихоокеанская сельдь по домашнему рецепту.', 'Тихоокеанський оселедець за домашнім рецептом.'),
      2990, 'kg', 0.5, 0.5, 30, '/img/salted.svg', 7],
    [L('Pstrąg lekko solony', 'Lightly salted trout', 'Форель слабосолёная', 'Форель слабосолона'), 'salted',
      L('Filet ze skórą, solony 24 godziny.', 'Skin-on fillet, cured for 24 hours.', 'Филе на коже, засолка 24 часа.', 'Філе на шкірі, засолювання 24 години.'),
      11990, 'kg', 0.5, 0.5, 12, '/img/salted.svg', 8],
    [L('Płoć suszona', 'Dried roach', 'Вобла вяленая', 'Тараня в’ялена'), 'salted',
      L('Wyselekcjonowana suszona płoć.', 'Selected dried roach.', 'Отборная вяленая вобла.', 'Добірна в’ялена тараня.'),
      790, 'pcs', 1, 1, 100, '/img/salted.svg', 9],
  ];
  for (const it of items) seed.run(...it);
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Разбирает многоязычное поле. Старые/битые значения превращаются в {pl: строка}.
function parseI18n(value) {
  try {
    const obj = JSON.parse(value);
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(LANGS.map((l) => [l, typeof obj[l] === 'string' ? obj[l] : '']));
    }
  } catch { /* не JSON */ }
  return Object.fromEntries(LANGS.map((l) => [l, l === 'pl' ? String(value ?? '') : '']));
}

// Текст на нужном языке с запасным вариантом (польский, затем любой заполненный)
function pickLang(value, lang) {
  const obj = typeof value === 'string' ? parseI18n(value) : value;
  return obj[lang] || obj.pl || LANGS.map((l) => obj[l]).find(Boolean) || '';
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

module.exports = { db, getSettings, transaction, parseI18n, pickLang, LANGS, DEFAULT_SETTINGS, MONEY_SETTINGS, I18N_SETTINGS };
