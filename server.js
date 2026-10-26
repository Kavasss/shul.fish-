// Сервер интернет-магазина рыбы: каталог, корзина, оформление заказа с доставкой, админ-панель.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

// Секреты берутся из .env (файл не хранится в репозитории) или из переменных окружения
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* .env может отсутствовать */ }

const { db, getSettings, transaction, DEFAULT_SETTINGS } = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!ADMIN_PASSWORD) console.warn('⚠  ADMIN_PASSWORD не задан в .env — вход в админ-панель отключён.');
if (!process.env.SESSION_SECRET) console.warn('⚠  SESSION_SECRET не задан — сессии админа сбросятся при перезапуске.');

const CATEGORIES = { fresh: 'Свежая', smoked: 'Копчёная', salted: 'Солёная' };
const STATUSES = { new: 'Новый', confirmed: 'Подтверждён', delivering: 'Доставляется', done: 'Выполнен', cancelled: 'Отменён' };

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'",
  });
  next();
});
app.use(express.json({ limit: '100kb' }));

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

// Приводит количество к шагу товара (вниз) и к минимуму
function normalizeQty(p, qty) {
  qty = Number(qty);
  if (!Number.isFinite(qty) || qty <= 0) return p.min_qty;
  qty = round3(Math.round(qty / p.step) * p.step);
  return Math.max(qty, p.min_qty);
}

// Данные товара для покупателя — без остатка на складе
function publicProduct(p) {
  return {
    id: p.id, name: p.name, category: p.category, description: p.description,
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

function publicSettings(s) {
  return {
    shop_name: s.shop_name, shop_phone: s.shop_phone,
    delivery_cost: Number(s.delivery_cost) || 0,
    free_delivery_from: Number(s.free_delivery_from) || 0,
    min_order: Number(s.min_order) || 0,
    pickup_address: s.pickup_address,
    delivery_slots: s.delivery_slots.split('\n').map((x) => x.trim()).filter(Boolean),
    delivery_note: s.delivery_note,
  };
}

// Проверяет корзину по текущему остатку: ограничивает количество, но не раскрывает сам остаток
function checkCart(rawItems) {
  if (!Array.isArray(rawItems)) throw new HttpError(400, 'Некорректная корзина');
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
function setSidCookie(res, value, maxAgeSec) {
  res.append('Set-Cookie', `sid=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${COOKIE_SECURE ? '; Secure' : ''}`);
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
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || rec.until < now) return false;
  return rec.count >= 10;
}
function registerFail(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || rec.until < now) loginAttempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
  else rec.count++;
}

// ---------- Уведомление в Telegram (необязательно) ----------

async function notifyTelegram(orderId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const text = [
    `🐟 Новый заказ №${o.id}`,
    `${o.customer_name}, ${o.phone}`,
    o.delivery_method === 'courier' ? `Доставка: ${o.address}` : 'Самовывоз',
    `${o.delivery_date} ${o.delivery_time}`.trim(),
    '',
    ...items.map((i) => `• ${i.name} — ${i.qty} ${i.unit} = ${i.sum} ₽`),
    '',
    `Итого: ${o.total} ₽`,
    o.comment ? `Комментарий: ${o.comment}` : '',
  ].filter((x) => x !== null).join('\n');
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

// ---------- Публичное API ----------

app.get('/api/settings', (req, res) => {
  res.json({ ...publicSettings(getSettings()), categories: CATEGORIES });
});

app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY sort, id').all();
  res.json(rows.map(publicProduct));
});

app.post('/api/cart/check', (req, res) => {
  const items = checkCart(req.body?.items);
  const itemsTotal = items.reduce((s, i) => s + (i.sum || 0), 0);
  const s = getSettings();
  res.json({
    items,
    items_total: itemsTotal,
    delivery_cost: deliveryCost(req.body?.delivery_method === 'pickup' ? 'pickup' : 'courier', itemsTotal, s),
  });
});

app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const s = getSettings();
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

  if (order.customer_name.length < 2) throw new HttpError(400, 'Укажите имя');
  const digits = order.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) throw new HttpError(400, 'Укажите корректный номер телефона');
  if (order.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) throw new HttpError(400, 'Некорректный e-mail');
  if (order.delivery_method === 'courier' && order.address.length < 5) throw new HttpError(400, 'Укажите адрес доставки');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.delivery_date)) throw new HttpError(400, 'Выберите дату');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(order.delivery_date + 'T00:00:00');
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 14);
  if (Number.isNaN(date.getTime()) || date < today || date > maxDate) throw new HttpError(400, 'Дата должна быть в пределах двух недель');
  const slots = publicSettings(s).delivery_slots;
  if (order.delivery_method === 'courier' && slots.length && !slots.includes(order.delivery_time)) {
    throw new HttpError(400, 'Выберите время доставки');
  }
  if (order.delivery_method === 'pickup') order.address = '';

  if (!Array.isArray(b.items) || b.items.length === 0) throw new HttpError(400, 'Корзина пуста');

  const orderId = transaction(() => {
    const getP = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    const lines = [];
    const problems = [];
    for (const raw of b.items.slice(0, 100)) {
      const p = getP.get(Number(raw?.id));
      if (!p) { problems.push({ id: Number(raw?.id), message: 'Товар больше не продаётся' }); continue; }
      const qty = normalizeQty(p, raw.qty);
      if (qty > maxOrderQty(p)) {
        problems.push({ id: p.id, message: `«${p.name}»: столько заказать нельзя, уменьшите количество` });
        continue;
      }
      lines.push({ p, qty, sum: Math.round(qty * p.price) });
    }
    if (problems.length) throw new HttpError(409, problems.map((x) => x.message).join('\n'), { problems });

    const itemsTotal = lines.reduce((sum, l) => sum + l.sum, 0);
    const minOrder = Number(s.min_order) || 0;
    if (itemsTotal < minOrder) throw new HttpError(400, `Минимальная сумма заказа — ${minOrder} ₽`);
    const dCost = deliveryCost(order.delivery_method, itemsTotal, s);

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO orders (customer_name, phone, email, delivery_method, address, delivery_date, delivery_time,
                          payment_method, comment, items_total, delivery_cost, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      order.customer_name, order.phone, order.email, order.delivery_method, order.address,
      order.delivery_date, order.delivery_time, order.payment_method, order.comment,
      itemsTotal, dCost, itemsTotal + dCost,
    );
    const insItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, unit, price, qty, sum) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const decStock = db.prepare("UPDATE products SET stock = max(0, round(stock - ?, 3)), updated_at = datetime('now') WHERE id = ?");
    for (const l of lines) {
      insItem.run(lastInsertRowid, l.p.id, l.p.name, l.p.unit, l.p.price, l.qty, l.sum);
      decStock.run(l.qty, l.p.id);
    }
    return Number(lastInsertRowid);
  });

  notifyTelegram(orderId);
  const o = db.prepare('SELECT id, total FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ id: o.id, total: o.total });
});

// ---------- Админ API ----------

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

function readProductInput(b) {
  const p = {
    name: str(b.name, 150),
    category: b.category,
    description: str(b.description, 2000),
    price: Math.round(Number(b.price)),
    unit: b.unit === 'шт' ? 'шт' : 'кг',
    step: round3(Number(b.step)),
    min_qty: round3(Number(b.min_qty)),
    stock: round3(Number(b.stock)),
    image: str(b.image, 500),
    is_active: b.is_active === false || b.is_active === 0 ? 0 : 1,
    sort: Math.round(Number(b.sort) || 0),
  };
  if (!p.name) throw new HttpError(400, 'Укажите название');
  if (!CATEGORIES[p.category]) throw new HttpError(400, 'Неверная категория');
  if (!Number.isFinite(p.price) || p.price < 0) throw new HttpError(400, 'Неверная цена');
  if (!Number.isFinite(p.step) || p.step <= 0) throw new HttpError(400, 'Шаг должен быть больше 0');
  if (!Number.isFinite(p.min_qty) || p.min_qty <= 0) throw new HttpError(400, 'Минимальный заказ должен быть больше 0');
  if (!Number.isFinite(p.stock) || p.stock < 0) throw new HttpError(400, 'Неверное количество в наличии');
  if (p.image && !/^(\/uploads\/|\/img\/|https:\/\/)/.test(p.image)) throw new HttpError(400, 'Неверная ссылка на фото');
  return p;
}

admin.get('/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY sort, id').all());
});

admin.post('/products', (req, res) => {
  const p = readProductInput(req.body || {});
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO products (name, category, description, price, unit, step, min_qty, stock, image, is_active, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    p.name, p.category, p.description, p.price, p.unit, p.step, p.min_qty, p.stock, p.image, p.is_active, p.sort,
  );
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(lastInsertRowid));
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
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id)));
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
  res.json(p);
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
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!o) return null;
  o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(id);
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
  const rows = db.prepare(`
    SELECT o.*, group_concat(i.name || ' x ' || i.qty || ' ' || i.unit, '; ') AS items
    FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
    GROUP BY o.id ORDER BY o.id DESC`).all();
  const cols = ['id', 'created_at', 'status', 'customer_name', 'phone', 'email', 'delivery_method', 'address',
    'delivery_date', 'delivery_time', 'payment_method', 'items', 'items_total', 'delivery_cost', 'total', 'comment', 'admin_note'];
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=@\t\r]|^[+-](?!\d)/.test(s)) s = "'" + s; // защита от формул в Excel
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => esc(c === 'status' ? STATUSES[r.status] : r[c])).join(';'))].join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="orders.csv"' });
  res.send(csv);
});

admin.get('/settings', (req, res) => res.json(getSettings()));

admin.put('/settings', (req, res) => {
  const b = req.body || {};
  const upd = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (b[key] === undefined) continue;
    let v = str(String(b[key]), 2000);
    if (['delivery_cost', 'free_delivery_from', 'min_order'].includes(key)) {
      const num = Math.round(Number(v));
      if (!Number.isFinite(num) || num < 0) throw new HttpError(400, 'Суммы должны быть неотрицательными числами');
      v = String(num);
    }
    upd.run(key, v);
  }
  res.json(getSettings());
});

admin.get('/stats', (req, res) => {
  res.json({
    new_orders: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get().n,
    today_orders: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')").get().n,
    today_revenue: db.prepare("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'").get().s,
    out_of_stock: db.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1 AND stock < min_qty').get().n,
  });
});

app.use('/api/admin', admin);

// ---------- Статика ----------

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Не найдено' }));

// Обработка ошибок
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректные данные' });
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => console.log(`Магазин запущен: http://localhost:${PORT}  (админка: /admin)`));
