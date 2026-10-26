// Сервер интернет-магазина рыбы: каталог, корзина, оформление заказа с доставкой, админ-панель.
// Валюта — польский злотый (PLN), все суммы внутри хранятся в грошах.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

// Секреты берутся из .env (файл не хранится в репозитории) или из переменных окружения
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* .env может отсутствовать */ }

const {
  db, getSettings, transaction, parseI18n, pickLang, LANGS, DEFAULT_SETTINGS, MONEY_SETTINGS, I18N_SETTINGS,
} = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const USER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // покупатель остаётся в аккаунте 30 дней
const ADMIN_LANG = 'ru'; // язык админ-панели, уведомлений и выгрузки
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!ADMIN_PASSWORD) console.warn('⚠  ADMIN_PASSWORD не задан в .env — вход в админ-панель отключён.');
if (!process.env.SESSION_SECRET) console.warn('⚠  SESSION_SECRET не задан — сессии админа сбросятся при перезапуске.');

const CATEGORIES = ['fresh', 'smoked', 'salted'];
const STATUSES = { new: 'Новый', confirmed: 'Подтверждён', delivering: 'Доставляется', done: 'Выполнен', cancelled: 'Отменён' };
const UNITS_RU = { kg: 'кг', pcs: 'шт' };

// Сообщения для покупателя на его языке
const MESSAGES = {
  bad_cart: { pl: 'Nieprawidłowy koszyk', en: 'Invalid cart', ru: 'Некорректная корзина', uk: 'Некоректний кошик' },
  name_required: { pl: 'Podaj imię', en: 'Please enter your name', ru: 'Укажите имя', uk: 'Вкажіть ім’я' },
  phone_invalid: { pl: 'Podaj poprawny numer telefonu', en: 'Please enter a valid phone number', ru: 'Укажите корректный номер телефона', uk: 'Вкажіть коректний номер телефону' },
  email_invalid: { pl: 'Nieprawidłowy e-mail', en: 'Invalid e-mail', ru: 'Некорректный e-mail', uk: 'Некоректний e-mail' },
  address_required: { pl: 'Podaj adres dostawy', en: 'Please enter the delivery address', ru: 'Укажите адрес доставки', uk: 'Вкажіть адресу доставки' },
  date_required: { pl: 'Wybierz datę', en: 'Please choose a date', ru: 'Выберите дату', uk: 'Оберіть дату' },
  date_range: { pl: 'Data musi przypadać w ciągu najbliższych dwóch tygodni', en: 'The date must be within the next two weeks', ru: 'Дата должна быть в пределах двух недель', uk: 'Дата має бути в межах двох тижнів' },
  time_required: { pl: 'Wybierz godzinę dostawy', en: 'Please choose a delivery time', ru: 'Выберите время доставки', uk: 'Оберіть час доставки' },
  cart_empty: { pl: 'Koszyk jest pusty', en: 'Your cart is empty', ru: 'Корзина пуста', uk: 'Кошик порожній' },
  not_sold: { pl: 'Produkt nie jest już dostępny', en: 'This product is no longer available', ru: 'Товар больше не продаётся', uk: 'Товар більше не продається' },
  too_many: { pl: '„{name}”: nie można zamówić takiej ilości, zmniejsz ją', en: '“{name}”: this quantity is not available, please reduce it', ru: '«{name}»: столько заказать нельзя, уменьшите количество', uk: '«{name}»: стільки замовити не можна, зменште кількість' },
  min_order: { pl: 'Minimalna wartość zamówienia to {sum}', en: 'Minimum order value is {sum}', ru: 'Минимальная сумма заказа — {sum}', uk: 'Мінімальна сума замовлення — {sum}' },
  not_found: { pl: 'Nie znaleziono', en: 'Not found', ru: 'Не найдено', uk: 'Не знайдено' },
  too_large: { pl: 'Zbyt duże żądanie', en: 'Request too large', ru: 'Слишком большой запрос', uk: 'Завеликий запит' },
  bad_data: { pl: 'Nieprawidłowe dane', en: 'Invalid data', ru: 'Некорректные данные', uk: 'Некоректні дані' },
  password_short: { pl: 'Hasło musi mieć co najmniej 8 znaków', en: 'Password must be at least 8 characters', ru: 'Пароль должен быть не короче 8 символов', uk: 'Пароль має бути не коротшим за 8 символів' },
  email_taken: { pl: 'Konto z tym adresem e-mail już istnieje', en: 'An account with this e-mail already exists', ru: 'Аккаунт с таким e-mail уже существует', uk: 'Акаунт із таким e-mail уже існує' },
  bad_credentials: { pl: 'Nieprawidłowy e-mail lub hasło', en: 'Incorrect e-mail or password', ru: 'Неверный e-mail или пароль', uk: 'Неправильний e-mail або пароль' },
  too_many_attempts: { pl: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut', en: 'Too many attempts. Try again in 15 minutes', ru: 'Слишком много попыток. Попробуйте через 15 минут', uk: 'Забагато спроб. Спробуйте за 15 хвилин' },
  login_required: { pl: 'Zaloguj się', en: 'Please sign in', ru: 'Войдите в аккаунт', uk: 'Увійдіть в акаунт' },
  password_wrong: { pl: 'Obecne hasło jest nieprawidłowe', en: 'Current password is incorrect', ru: 'Текущий пароль указан неверно', uk: 'Поточний пароль неправильний' },
  consent_required: { pl: 'Zaakceptuj politykę prywatności', en: 'Please accept the privacy policy', ru: 'Примите политику конфиденциальности', uk: 'Прийміть політику конфіденційності' },
  message_short: { pl: 'Wiadomość jest za krótka', en: 'The message is too short', ru: 'Сообщение слишком короткое', uk: 'Повідомлення занадто коротке' },
  too_many_messages: { pl: 'Wysłano zbyt wiele wiadomości. Spróbuj później', en: 'Too many messages sent. Please try later', ru: 'Отправлено слишком много сообщений. Попробуйте позже', uk: 'Надіслано забагато повідомлень. Спробуйте пізніше' },
  server_error: { pl: 'Błąd serwera', en: 'Server error', ru: 'Внутренняя ошибка сервера', uk: 'Внутрішня помилка сервера' },
};
const LOCALES = { pl: 'pl-PL', en: 'en-GB', ru: 'ru-RU', uk: 'uk-UA' };

function msg(lang, key, params = {}) {
  const text = MESSAGES[key][lang] || MESSAGES[key].pl;
  return text.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
}
function fmtMoney(grosze, lang = 'pl') {
  const n = new Intl.NumberFormat(LOCALES[lang] || 'pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grosze / 100);
  return `${n} zł`;
}

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; frame-ancestors 'none'",
  });
  // Язык покупателя: заголовок X-Lang от нашего JS
  const lang = req.get('X-Lang');
  req.lang = LANGS.includes(lang) ? lang : 'pl';
  next();
});
app.use(express.json({ limit: '200kb' }));

// ---------- Вспомогательные функции ----------

class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

const round3 = (x) => Math.round(x * 1000) / 1000;
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Максимальное количество, которое можно заказать (кратно шагу, не больше остатка)
function maxOrderQty(p) {
  return round3(Math.floor(p.stock / p.step + 1e-9) * p.step);
}

// Приводит количество к шагу товара и к минимуму
function normalizeQty(p, qty) {
  qty = Number(qty);
  if (!Number.isFinite(qty) || qty <= 0) return p.min_qty;
  qty = round3(Math.round(qty / p.step) * p.step);
  return Math.max(qty, p.min_qty);
}

// Данные товара для покупателя — без остатка на складе
function publicProduct(p) {
  return {
    id: p.id, name: parseI18n(p.name), category: p.category, description: parseI18n(p.description),
    price: p.price, unit: p.unit, step: p.step, min_qty: p.min_qty, image: p.image,
    available: maxOrderQty(p) >= p.min_qty,
  };
}

function deliveryCost(method, itemsTotal, s) {
  if (method !== 'courier') return 0;
  const free = Number(s.free_delivery_from) || 0;
  if (free > 0 && itemsTotal >= free) return 0;
  return Number(s.delivery_cost) || 0;
}

function deliverySlots(s) {
  return s.delivery_slots.split('\n').map((x) => x.trim()).filter(Boolean);
}

function publicSettings(s) {
  return {
    shop_name: s.shop_name, shop_phone: s.shop_phone,
    delivery_cost: Number(s.delivery_cost) || 0,
    free_delivery_from: Number(s.free_delivery_from) || 0,
    min_order: Number(s.min_order) || 0,
    pickup_address: s.pickup_address,
    delivery_slots: deliverySlots(s),
    delivery_note: parseI18n(s.delivery_note),
    company_name: s.company_name, company_address: s.company_address, company_nip: s.company_nip, contact_email: s.contact_email,
    currency: 'PLN',
    languages: LANGS,
  };
}

// Проверяет корзину по текущему остатку: ограничивает количество, но не раскрывает сам остаток
function checkCart(rawItems, lang) {
  if (!Array.isArray(rawItems)) throw new HttpError(400, msg(lang, 'bad_cart'));
  const getP = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
  const items = [];
  for (const raw of rawItems.slice(0, 100)) {
    const p = getP.get(Number(raw?.id));
    if (!p) { items.push({ id: Number(raw?.id), removed: true }); continue; }
    const max = maxOrderQty(p);
    const wanted = normalizeQty(p, raw.qty);
    if (max < p.min_qty) {
      items.push({ ...publicProduct(p), qty: 0, sum: 0, unavailable: true });
      continue;
    }
    const qty = Math.min(wanted, max);
    items.push({ ...publicProduct(p), qty, sum: Math.round(qty * p.price), limited: qty < wanted });
  }
  return items;
}

// ---------- Сессии администратора (подписанная cookie) ----------

function sign(data) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
}
function makeSessionCookie() {
  const payload = Buffer.from(JSON.stringify({ u: ADMIN_LOGIN, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function readCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
function isAdmin(req) {
  const token = readCookies(req).sid;
  if (!token || !ADMIN_PASSWORD) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.u === ADMIN_LOGIN && data.exp > Date.now();
  } catch { return false; }
}
function setCookie(res, name, value, maxAgeSec, sameSite = 'Strict') {
  res.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSec}${COOKIE_SECURE ? '; Secure' : ''}`);
}
function setSidCookie(res, value, maxAgeSec) {
  setCookie(res, 'sid', value, maxAgeSec);
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Требуется вход' });
  // Защита от CSRF: изменяющие запросы должны приходить от нашего JS
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({ error: 'Запрос отклонён' });
  }
  next();
}

// Простое ограничение попыток входа
const loginAttempts = new Map();
function tooManyAttempts(ip) {
  const rec = loginAttempts.get(ip);
  return !!rec && rec.until > Date.now() && rec.count >= 10;
}
function registerFail(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || rec.until < now) loginAttempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
  else rec.count++;
}

// ---------- Аккаунты покупателей ----------

// Хеш пароля: scrypt с уникальной солью, формат scrypt$<соль>$<хеш>
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function checkPassword(password, stored) {
  const [alg, salt, hash] = String(stored).split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(String(password), Buffer.from(salt, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}
// Хеш-заглушка, чтобы вход с несуществующим e-mail занимал столько же времени
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

function startUserSession(res, user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, v: user.session_ver, exp: Date.now() + USER_SESSION_TTL_MS })).toString('base64url');
  setCookie(res, 'uid', `${payload}.${sign('user:' + payload)}`, USER_SESSION_TTL_MS / 1000, 'Lax');
}

// Текущий покупатель по cookie или null
function currentUser(req) {
  const token = readCookies(req).uid;
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign('user:' + payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!(data.exp > Date.now())) return null;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(data.id);
    return user && user.session_ver === data.v ? user : null;
  } catch { return null; }
}

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, phone: u.phone, address: u.address });

// Изменяющие запросы покупателя — только от нашего JS (защита от CSRF)
function requireFetch(req) {
  if (req.get('X-Requested-With') !== 'fetch') throw new HttpError(403, msg(req.lang, 'bad_data'));
}
function requireUser(req) {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, msg(req.lang, 'login_required'));
  return user;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/auth/register', (req, res) => {
  requireFetch(req);
  const lang = req.lang;
  const b = req.body || {};
  const email = str(b.email, 100).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const name = str(b.name, 100);
  if (!EMAIL_RE.test(email)) throw new HttpError(400, msg(lang, 'email_invalid'));
  if (password.length < 8 || password.length > 200) throw new HttpError(400, msg(lang, 'password_short'));
  if (name.length < 2) throw new HttpError(400, msg(lang, 'name_required'));
  if (b.consent !== true) throw new HttpError(400, msg(lang, 'consent_required'));
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new HttpError(409, msg(lang, 'email_taken'));
  const { lastInsertRowid } = db.prepare('INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)')
    .run(email, hashPassword(password), name, str(b.phone, 30));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  startUserSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  requireFetch(req);
  const lang = req.lang;
  const key = `user:${req.ip}`;
  if (tooManyAttempts(key)) throw new HttpError(429, msg(lang, 'too_many_attempts'));
  const email = str(req.body?.email, 100).toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = checkPassword(password, user ? user.password_hash : DUMMY_HASH) && !!user;
  if (!ok) {
    registerFail(key);
    throw new HttpError(401, msg(lang, 'bad_credentials'));
  }
  loginAttempts.delete(key);
  startUserSession(res, user);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  setCookie(res, 'uid', '', 0, 'Lax');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = currentUser(req);
  res.json({ user: user ? publicUser(user) : null });
});

app.put('/api/account', (req, res) => {
  requireFetch(req);
  const lang = req.lang;
  const user = requireUser(req);
  const b = req.body || {};
  const name = str(b.name, 100);
  const phone = str(b.phone, 30);
  if (name.length < 2) throw new HttpError(400, msg(lang, 'name_required'));
  const digits = phone.replace(/\D/g, '');
  if (phone && (digits.length < 9 || digits.length > 15)) throw new HttpError(400, msg(lang, 'phone_invalid'));
  db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?').run(name, phone, str(b.address, 300), user.id);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) });
});

app.post('/api/account/password', (req, res) => {
  requireFetch(req);
  const lang = req.lang;
  const user = requireUser(req);
  const next = typeof req.body?.new_password === 'string' ? req.body.new_password : '';
  if (!checkPassword(String(req.body?.current_password ?? ''), user.password_hash)) throw new HttpError(400, msg(lang, 'password_wrong'));
  if (next.length < 8 || next.length > 200) throw new HttpError(400, msg(lang, 'password_short'));
  // Новая версия сессии выкидывает аккаунт на всех других устройствах
  db.prepare('UPDATE users SET password_hash = ?, session_ver = session_ver + 1 WHERE id = ?').run(hashPassword(next), user.id);
  startUserSession(res, db.prepare('SELECT * FROM users WHERE id = ?').get(user.id));
  res.json({ ok: true });
});

// Удаление аккаунта (право на удаление данных). Заказы остаются для бухгалтерии, но отвязываются от аккаунта.
app.delete('/api/account', (req, res) => {
  requireFetch(req);
  const user = requireUser(req);
  if (!checkPassword(String(req.body?.password ?? ''), user.password_hash)) throw new HttpError(400, msg(req.lang, 'password_wrong'));
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  setCookie(res, 'uid', '', 0, 'Lax');
  res.json({ ok: true });
});

app.get('/api/account/orders', (req, res) => {
  const user = requireUser(req);
  const orders = db.prepare(`SELECT id, created_at, status, delivery_method, address, delivery_date, delivery_time,
                                    items_total, delivery_cost, total
                             FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100`).all(user.id);
  const itemsOf = db.prepare('SELECT name, unit, price, qty, sum FROM order_items WHERE order_id = ? ORDER BY id');
  res.json(orders.map((o) => ({ ...o, items: itemsOf.all(o.id).map((i) => ({ ...i, name: parseI18n(i.name) })) })));
});

// ---------- Обратная связь ----------

const feedbackLimits = new Map(); // не больше 5 сообщений в час с одного IP
app.post('/api/feedback', (req, res) => {
  requireFetch(req);
  const lang = req.lang;
  const b = req.body || {};
  // Скрытое поле-ловушка: люди его не видят, боты заполняют
  if (b.website) return res.status(201).json({ ok: true });
  const fb = {
    name: str(b.name, 100), email: str(b.email, 100).toLowerCase(), phone: str(b.phone, 30), message: str(b.message, 3000),
  };
  if (fb.name.length < 2) throw new HttpError(400, msg(lang, 'name_required'));
  if (!EMAIL_RE.test(fb.email)) throw new HttpError(400, msg(lang, 'email_invalid'));
  if (fb.message.length < 5) throw new HttpError(400, msg(lang, 'message_short'));
  if (b.consent !== true) throw new HttpError(400, msg(lang, 'consent_required'));
  const now = Date.now();
  const rec = feedbackLimits.get(req.ip);
  if (rec && rec.until > now && rec.count >= 5) throw new HttpError(429, msg(lang, 'too_many_messages'));
  if (!rec || rec.until < now) feedbackLimits.set(req.ip, { count: 1, until: now + 60 * 60 * 1000 });
  else rec.count++;
  const user = currentUser(req);
  const { lastInsertRowid } = db.prepare('INSERT INTO feedback (user_id, lang, name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user ? user.id : null, lang, fb.name, fb.email, fb.phone, fb.message);
  notifyTelegramText(`✉️ Сообщение №${lastInsertRowid} (${lang.toUpperCase()})\n${fb.name}, ${fb.email}${fb.phone ? ', ' + fb.phone : ''}\n\n${fb.message}`);
  res.status(201).json({ ok: true });
});

// ---------- Уведомление в Telegram (необязательно) ----------

async function notifyTelegramText(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch (e) {
    console.error('Не удалось отправить уведомление в Telegram:', e.message);
  }
}

async function notifyTelegram(orderId) {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  notifyTelegramText([
    `🐟 Новый заказ №${o.id} (язык: ${o.lang.toUpperCase()})`,
    `${o.customer_name}, ${o.phone}`,
    o.delivery_method === 'courier' ? `Доставка: ${o.address}` : 'Самовывоз',
    `${o.delivery_date} ${o.delivery_time}`.trim(),
    '',
    ...items.map((i) => `• ${pickLang(i.name, ADMIN_LANG)} — ${i.qty} ${UNITS_RU[i.unit]} = ${fmtMoney(i.sum, ADMIN_LANG)}`),
    '',
    `Итого: ${fmtMoney(o.total, ADMIN_LANG)}`,
    o.comment ? `Комментарий: ${o.comment}` : '',
  ].join('\n'));
}

// ---------- Публичное API ----------

app.get('/api/settings', (req, res) => {
  res.json(publicSettings(getSettings()));
});

app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY sort, id').all();
  res.json(rows.map(publicProduct));
});

app.post('/api/cart/check', (req, res) => {
  const items = checkCart(req.body?.items, req.lang);
  const itemsTotal = items.reduce((s, i) => s + (i.sum || 0), 0);
  const s = getSettings();
  res.json({
    items,
    items_total: itemsTotal,
    delivery_cost: deliveryCost(req.body?.delivery_method === 'pickup' ? 'pickup' : 'courier', itemsTotal, s),
  });
});

app.post('/api/orders', (req, res) => {
  const lang = req.lang;
  const b = req.body || {};
  const s = getSettings();
  const user = currentUser(req);
  const order = {
    customer_name: str(b.name, 100),
    phone: str(b.phone, 30),
    email: str(b.email, 100),
    delivery_method: b.delivery_method === 'pickup' ? 'pickup' : 'courier',
    address: str(b.address, 300),
    delivery_date: str(b.delivery_date, 10),
    delivery_time: str(b.delivery_time, 30),
    payment_method: b.payment_method === 'card' ? 'card' : 'cash',
    comment: str(b.comment, 1000),
  };

  if (order.customer_name.length < 2) throw new HttpError(400, msg(lang, 'name_required'));
  const digits = order.phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) throw new HttpError(400, msg(lang, 'phone_invalid'));
  if (!order.email && user) order.email = user.email;
  if (order.email && !EMAIL_RE.test(order.email)) throw new HttpError(400, msg(lang, 'email_invalid'));
  if (order.delivery_method === 'courier' && order.address.length < 5) throw new HttpError(400, msg(lang, 'address_required'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.delivery_date)) throw new HttpError(400, msg(lang, 'date_required'));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(order.delivery_date + 'T00:00:00');
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 14);
  if (Number.isNaN(date.getTime()) || date < today || date > maxDate) throw new HttpError(400, msg(lang, 'date_range'));
  const slots = deliverySlots(s);
  if (order.delivery_method === 'courier' && slots.length && !slots.includes(order.delivery_time)) {
    throw new HttpError(400, msg(lang, 'time_required'));
  }
  if (order.delivery_method === 'pickup') { order.address = ''; order.delivery_time = ''; }

  if (!Array.isArray(b.items) || b.items.length === 0) throw new HttpError(400, msg(lang, 'cart_empty'));

  const orderId = transaction(() => {
    const getP = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    const lines = [];
    const problems = [];
    for (const raw of b.items.slice(0, 100)) {
      const p = getP.get(Number(raw?.id));
      if (!p) { problems.push({ id: Number(raw?.id), message: msg(lang, 'not_sold') }); continue; }
      const qty = normalizeQty(p, raw.qty);
      if (qty > maxOrderQty(p)) {
        problems.push({ id: p.id, message: msg(lang, 'too_many', { name: pickLang(p.name, lang) }) });
        continue;
      }
      lines.push({ p, qty, sum: Math.round(qty * p.price) });
    }
    if (problems.length) throw new HttpError(409, problems.map((x) => x.message).join('\n'), { problems });

    const itemsTotal = lines.reduce((sum, l) => sum + l.sum, 0);
    const minOrder = Number(s.min_order) || 0;
    if (itemsTotal < minOrder) throw new HttpError(400, msg(lang, 'min_order', { sum: fmtMoney(minOrder, lang) }));
    const dCost = deliveryCost(order.delivery_method, itemsTotal, s);

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO orders (user_id, lang, customer_name, phone, email, delivery_method, address, delivery_date, delivery_time,
                          payment_method, comment, items_total, delivery_cost, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      user ? user.id : null, lang, order.customer_name, order.phone, order.email, order.delivery_method, order.address,
      order.delivery_date, order.delivery_time, order.payment_method, order.comment,
      itemsTotal, dCost, itemsTotal + dCost,
    );
    const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, unit, price, qty, sum) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const decStock = db.prepare("UPDATE products SET stock = max(0, round(stock - ?, 3)), updated_at = datetime('now') WHERE id = ?");
    for (const l of lines) {
      insItem.run(lastInsertRowid, l.p.id, l.p.name, l.p.unit, l.p.price, l.qty, l.sum);
      decStock.run(l.qty, l.p.id);
    }
    // Запоминаем телефон и адрес в профиле, если они там ещё не заполнены
    if (user) {
      db.prepare("UPDATE users SET phone = CASE WHEN phone = '' THEN ? ELSE phone END, address = CASE WHEN address = '' THEN ? ELSE address END WHERE id = ?")
        .run(order.phone, order.address, user.id);
    }
    return Number(lastInsertRowid);
  });

  notifyTelegram(orderId);
  const o = db.prepare('SELECT id, total FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ id: o.id, total: o.total });
});

// ---------- Админ API (интерфейс на русском) ----------

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip;
  if (!ADMIN_PASSWORD) throw new HttpError(503, 'Пароль администратора не настроен на сервере (ADMIN_PASSWORD в .env)');
  if (tooManyAttempts(ip)) throw new HttpError(429, 'Слишком много попыток. Попробуйте через 15 минут');
  const okLogin = safeEqual(str(req.body?.login, 100), ADMIN_LOGIN);
  const okPass = safeEqual(String(req.body?.password ?? ''), ADMIN_PASSWORD);
  if (!okLogin || !okPass) {
    registerFail(ip);
    throw new HttpError(401, 'Неверный логин или пароль');
  }
  loginAttempts.delete(ip);
  setSidCookie(res, makeSessionCookie(), SESSION_TTL_MS / 1000);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  setSidCookie(res, '', 0);
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => res.json({ admin: isAdmin(req) }));

const admin = express.Router();
admin.use(requireAdmin);

// Многоязычное поле из формы: {pl, en, ru, uk}
function readI18n(v, max) {
  const src = v && typeof v === 'object' ? v : {};
  return Object.fromEntries(LANGS.map((l) => [l, str(src[l], max)]));
}

function adminProduct(p) {
  return { ...p, name: parseI18n(p.name), description: parseI18n(p.description) };
}

function readProductInput(b) {
  const name = readI18n(b.name, 150);
  const p = {
    name: JSON.stringify(name),
    category: b.category,
    description: JSON.stringify(readI18n(b.description, 2000)),
    price: Math.round(Number(b.price)), // грош
    unit: b.unit === 'pcs' ? 'pcs' : 'kg',
    step: round3(Number(b.step)),
    min_qty: round3(Number(b.min_qty)),
    stock: round3(Number(b.stock)),
    image: str(b.image, 500),
    is_active: b.is_active === false || b.is_active === 0 ? 0 : 1,
    sort: Math.round(Number(b.sort) || 0),
  };
  if (!name.pl) throw new HttpError(400, 'Укажите название хотя бы на польском');
  if (!CATEGORIES.includes(p.category)) throw new HttpError(400, 'Неверная категория');
  if (!Number.isFinite(p.price) || p.price < 0) throw new HttpError(400, 'Неверная цена');
  if (!Number.isFinite(p.step) || p.step <= 0) throw new HttpError(400, 'Шаг должен быть больше 0');
  if (!Number.isFinite(p.min_qty) || p.min_qty <= 0) throw new HttpError(400, 'Минимальный заказ должен быть больше 0');
  if (!Number.isFinite(p.stock) || p.stock < 0) throw new HttpError(400, 'Неверное количество в наличии');
  if (p.image && !/^(\/uploads\/|\/img\/|https:\/\/)/.test(p.image)) throw new HttpError(400, 'Неверная ссылка на фото');
  return p;
}

admin.get('/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY sort, id').all().map(adminProduct));
});

admin.post('/products', (req, res) => {
  const p = readProductInput(req.body || {});
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO products (name, category, description, price, unit, step, min_qty, stock, image, is_active, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    p.name, p.category, p.description, p.price, p.unit, p.step, p.min_qty, p.stock, p.image, p.is_active, p.sort,
  );
  res.status(201).json(adminProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(lastInsertRowid)));
});

admin.put('/products/:id', (req, res) => {
  const p = readProductInput(req.body || {});
  const r = db.prepare(`
    UPDATE products SET name=?, category=?, description=?, price=?, unit=?, step=?, min_qty=?, stock=?,
                        image=?, is_active=?, sort=?, updated_at=datetime('now')
    WHERE id = ?`).run(
    p.name, p.category, p.description, p.price, p.unit, p.step, p.min_qty, p.stock, p.image, p.is_active, p.sort,
    Number(req.params.id),
  );
  if (!r.changes) throw new HttpError(404, 'Товар не найден');
  res.json(adminProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id))));
});

// Быстрое изменение наличия / видимости прямо из таблицы
admin.patch('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  if (b.stock !== undefined) {
    const stock = round3(Number(b.stock));
    if (!Number.isFinite(stock) || stock < 0) throw new HttpError(400, 'Неверное количество');
    db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?").run(stock, id);
  }
  if (b.is_active !== undefined) {
    db.prepare("UPDATE products SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(b.is_active ? 1 : 0, id);
  }
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) throw new HttpError(404, 'Товар не найден');
  res.json(adminProduct(p));
});

admin.delete('/products/:id', (req, res) => {
  const r = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));
  if (!r.changes) throw new HttpError(404, 'Товар не найден');
  res.json({ ok: true });
});

// Загрузка фото товара (тело запроса — сам файл)
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
admin.post('/upload', express.raw({ type: Object.keys(IMAGE_TYPES), limit: '5mb' }), (req, res) => {
  const ext = IMAGE_TYPES[req.get('Content-Type')];
  if (!ext || !Buffer.isBuffer(req.body) || req.body.length === 0) throw new HttpError(400, 'Поддерживаются JPG, PNG, WEBP до 5 МБ');
  const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  res.status(201).json({ url: `/uploads/${name}` });
});

function orderWithItems(id) {
  const o = db.prepare('SELECT o.*, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?').get(id);
  if (!o) return null;
  o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(id)
    .map((i) => ({ ...i, name: pickLang(i.name, ADMIN_LANG) }));
  return o;
}

admin.get('/orders', (req, res) => {
  const status = STATUSES[req.query.status] ? req.query.status : null;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 500').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 500').all();
  const counts = Object.fromEntries(
    db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all().map((r) => [r.status, r.n]),
  );
  res.json({ orders: rows, counts, statuses: STATUSES });
});

admin.get('/orders/:id', (req, res) => {
  const o = orderWithItems(Number(req.params.id));
  if (!o) throw new HttpError(404, 'Заказ не найден');
  res.json(o);
});

admin.patch('/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  transaction(() => {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!o) throw new HttpError(404, 'Заказ не найден');
    if (b.status !== undefined && b.status !== o.status) {
      if (!STATUSES[b.status]) throw new HttpError(400, 'Неверный статус');
      if (o.status === 'cancelled') throw new HttpError(400, 'Отменённый заказ нельзя вернуть в работу');
      if (b.status === 'cancelled') {
        // Возвращаем товар в наличие
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        const inc = db.prepare("UPDATE products SET stock = round(stock + ?, 3), updated_at = datetime('now') WHERE id = ?");
        for (const i of items) if (i.product_id) inc.run(i.qty, i.product_id);
      }
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(b.status, id);
    }
    if (b.admin_note !== undefined) {
      db.prepare('UPDATE orders SET admin_note = ? WHERE id = ?').run(str(b.admin_note, 2000), id);
    }
  });
  res.json(orderWithItems(id));
});

admin.get('/orders-export.csv', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  const itemsOf = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id');
  const cols = ['id', 'created_at', 'status', 'lang', 'customer_name', 'phone', 'email', 'delivery_method', 'address',
    'delivery_date', 'delivery_time', 'payment_method', 'items', 'items_total', 'delivery_cost', 'total', 'comment', 'admin_note'];
  const zl = (g) => (g / 100).toFixed(2).replace('.', ',');
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=@\t\r]|^[+-](?!\d)/.test(s)) s = "'" + s; // защита от формул в Excel
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = orders.map((o) => {
    const row = {
      ...o,
      status: STATUSES[o.status],
      items: itemsOf.all(o.id).map((i) => `${pickLang(i.name, ADMIN_LANG)} x ${i.qty} ${UNITS_RU[i.unit]}`).join('; '),
      items_total: zl(o.items_total), delivery_cost: zl(o.delivery_cost), total: zl(o.total),
    };
    return cols.map((c) => esc(row[c])).join(';');
  });
  const csv = '﻿' + [cols.join(';'), ...lines].join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="orders.csv"' });
  res.send(csv);
});

admin.get('/feedback', (req, res) => {
  res.json(db.prepare(`SELECT f.*, u.email AS user_email FROM feedback f LEFT JOIN users u ON u.id = f.user_id
                       ORDER BY (f.status = 'new') DESC, f.id DESC LIMIT 500`).all());
});

admin.patch('/feedback/:id', (req, res) => {
  const b = req.body || {};
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM feedback WHERE id = ?').get(id)) throw new HttpError(404, 'Сообщение не найдено');
  if (b.status !== undefined) {
    if (!['new', 'done'].includes(b.status)) throw new HttpError(400, 'Неверный статус');
    db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(b.status, id);
  }
  if (b.admin_note !== undefined) db.prepare('UPDATE feedback SET admin_note = ? WHERE id = ?').run(str(b.admin_note, 2000), id);
  res.json(db.prepare('SELECT * FROM feedback WHERE id = ?').get(id));
});

admin.delete('/feedback/:id', (req, res) => {
  const r = db.prepare('DELETE FROM feedback WHERE id = ?').run(Number(req.params.id));
  if (!r.changes) throw new HttpError(404, 'Сообщение не найдено');
  res.json({ ok: true });
});

admin.get('/settings', (req, res) => {
  const s = getSettings();
  for (const k of I18N_SETTINGS) s[k] = parseI18n(s[k]);
  for (const k of MONEY_SETTINGS) s[k] = Number(s[k]) || 0;
  res.json(s);
});

admin.put('/settings', (req, res) => {
  const b = req.body || {};
  const upd = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (b[key] === undefined) continue;
    let v;
    if (MONEY_SETTINGS.includes(key)) {
      const num = Math.round(Number(b[key])); // грош
      if (!Number.isFinite(num) || num < 0) throw new HttpError(400, 'Суммы должны быть неотрицательными числами');
      v = String(num);
    } else if (I18N_SETTINGS.includes(key)) {
      v = JSON.stringify(readI18n(b[key], 2000));
    } else {
      v = str(String(b[key]), 2000);
    }
    upd.run(key, v);
  }
  res.json({ ok: true });
});

admin.get('/stats', (req, res) => {
  res.json({
    new_orders: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get().n,
    today_orders: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')").get().n,
    today_revenue: db.prepare("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'").get().s,
    customers: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    new_feedback: db.prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'").get().n,
    out_of_stock: db.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1 AND stock < min_qty').get().n,
  });
});

app.use('/api/admin', admin);

// ---------- Статика ----------

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res) => res.status(404).json({ error: msg(req.lang, 'not_found') }));

// Обработка ошибок
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: msg(req.lang, 'too_large') });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: msg(req.lang, 'bad_data') });
  console.error(err);
  res.status(500).json({ error: msg(req.lang, 'server_error') });
});

app.listen(PORT, () => console.log(`Shul.Fish запущен: http://localhost:${PORT}  (админка: /admin)`));
