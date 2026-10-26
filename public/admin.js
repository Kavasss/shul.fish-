// Админ-панель: заказы, товары, наличие, настройки доставки
const CATS = { fresh: 'Свежая', smoked: 'Копчёная', salted: 'Солёная' };
const METHODS = { courier: 'Доставка', pickup: 'Самовывоз' };
const PAYMENTS = { cash: 'Наличные', card: 'Карта' };
let STATUSES = { new: 'Новый', confirmed: 'Подтверждён', delivering: 'Доставляется', done: 'Выполнен', cancelled: 'Отменён' };
let products = [];
let editingId = null;

const fmtDate = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
const statusBadge = (s) => `<span class="status status--${s}">${esc(STATUSES[s] || s)}</span>`;

// Если сессия истекла — показываем вход
async function adminApi(url, options) {
  try {
    return await api(url, options);
  } catch (e) {
    if (e.status === 401) showLogin();
    throw e;
  }
}

// ---------- Вход / выход ----------

function showLogin() {
  $('#adminView').hidden = true;
  $('#loginView').hidden = false;
}

async function showAdmin() {
  $('#loginView').hidden = true;
  $('#adminView').hidden = false;
  await Promise.all([loadStats(), loadOrders()]);
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#loginError');
  err.hidden = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
    e.target.reset();
    await showAdmin();
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  showLogin();
});

// ---------- Вкладки ----------

$('#adminTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('#adminTabs .tab').forEach((t) => t.classList.toggle('active', t === btn));
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== btn.dataset.tab; });
  ({ orders: loadOrders, products: loadProducts, settings: loadSettings })[btn.dataset.tab]().catch((ex) => toast(ex.message, true));
});

async function loadStats() {
  const s = await adminApi('/api/admin/stats');
  $('#stats').innerHTML = `
    <div class="stat"><b>${s.new_orders}</b><span>новых заказов</span></div>
    <div class="stat"><b>${s.today_orders}</b><span>заказов сегодня</span></div>
    <div class="stat"><b>${money(s.today_revenue)}</b><span>выручка сегодня</span></div>
    <div class="stat"><b>${s.out_of_stock}</b><span>товаров закончилось</span></div>`;
}

// ---------- Заказы ----------

async function loadOrders() {
  const filter = $('#statusFilter');
  const status = filter.value || '';
  const data = await adminApi(`/api/admin/orders${status ? `?status=${status}` : ''}`);
  STATUSES = data.statuses;
  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
  filter.innerHTML = `<option value="">Все заказы (${total})</option>` +
    Object.entries(STATUSES).map(([k, v]) => `<option value="${k}">${v} (${data.counts[k] || 0})</option>`).join('');
  filter.value = status;
  $('#ordersBody').innerHTML = data.orders.length ? data.orders.map((o) => `
    <tr class="${o.status === 'new' ? 'row--new' : ''}">
      <td><b>${o.id}</b></td>
      <td class="nowrap">${fmtDate(o.created_at)}</td>
      <td>${esc(o.customer_name)}<br><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></td>
      <td>${METHODS[o.delivery_method]}<br><span class="muted small">${esc(o.delivery_date)} ${esc(o.delivery_time)}</span></td>
      <td class="nowrap"><b>${money(o.total)}</b></td>
      <td>${statusBadge(o.status)}</td>
      <td><button class="btn btn--sm" type="button" data-order="${o.id}">Открыть</button></td>
    </tr>`).join('') : '<tr><td colspan="7" class="muted">Заказов нет</td></tr>';
}

$('#statusFilter').addEventListener('change', () => loadOrders().catch((ex) => toast(ex.message, true)));

$('#ordersBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-order]');
  if (btn) openOrder(Number(btn.dataset.order)).catch((ex) => toast(ex.message, true));
});

async function openOrder(id) {
  const o = await adminApi(`/api/admin/orders/${id}`);
  $('#orderTitle').textContent = `Заказ №${o.id}`;
  const locked = o.status === 'cancelled';
  $('#orderDetails').innerHTML = `
    <dl class="dl">
      <dt>Создан</dt><dd>${fmtDate(o.created_at)}</dd>
      <dt>Клиент</dt><dd>${esc(o.customer_name)}</dd>
      <dt>Телефон</dt><dd><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd>
      ${o.email ? `<dt>E-mail</dt><dd>${esc(o.email)}</dd>` : ''}
      <dt>Получение</dt><dd>${METHODS[o.delivery_method]}${o.address ? `: ${esc(o.address)}` : ''}</dd>
      <dt>Когда</dt><dd>${esc(o.delivery_date)} ${esc(o.delivery_time)}</dd>
      <dt>Оплата</dt><dd>${PAYMENTS[o.payment_method]}</dd>
      ${o.comment ? `<dt>Комментарий</dt><dd>${esc(o.comment)}</dd>` : ''}
    </dl>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Товар</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
        <tbody>
          ${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="nowrap">${fmtQty(i.qty)} ${esc(i.unit)}</td><td class="nowrap">${money(i.price)}</td><td class="nowrap">${money(i.sum)}</td></tr>`).join('')}
          <tr><td colspan="3">Доставка</td><td>${money(o.delivery_cost)}</td></tr>
          <tr><td colspan="3"><b>Итого</b></td><td><b>${money(o.total)}</b></td></tr>
        </tbody>
      </table>
    </div>
    <label>Статус
      <select id="orderStatus" ${locked ? 'disabled' : ''}>
        ${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </label>
    <p class="muted small">При отмене заказа товары автоматически возвращаются в наличие.</p>
    <label>Заметка для себя<textarea id="orderNote" rows="2">${esc(o.admin_note)}</textarea></label>
    <button class="btn btn--primary" type="button" id="saveOrder">Сохранить</button>`;
  $('#saveOrder').onclick = async () => {
    const status = $('#orderStatus').value;
    if (status === 'cancelled' && o.status !== 'cancelled' && !confirm('Отменить заказ? Товары вернутся в наличие.')) return;
    try {
      await adminApi(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: { status, admin_note: $('#orderNote').value } });
      closeLayer($('#orderModal'));
      toast('Заказ сохранён');
      await Promise.all([loadOrders(), loadStats()]);
    } catch (ex) { toast(ex.message, true); }
  };
  openLayer($('#orderModal'));
}

// ---------- Товары ----------

async function loadProducts() {
  products = await adminApi('/api/admin/products');
  $('#productsBody').innerHTML = products.length ? products.map((p) => `
    <tr>
      <td>${p.image ? `<img src="${esc(p.image)}" alt="">` : ''}</td>
      <td><b>${esc(p.name)}</b>${p.stock < p.min_qty ? '<br><span class="badge badge--out">нет в наличии</span>' : ''}</td>
      <td>${CATS[p.category]}</td>
      <td class="nowrap">${money(p.price)} / ${esc(p.unit)}</td>
      <td>
        <div class="stock-cell">
          <input class="input stock-input" type="number" min="0" step="0.1" value="${p.stock}" data-stock="${p.id}" aria-label="В наличии">
          ${esc(p.unit)}
        </div>
      </td>
      <td><input type="checkbox" data-active="${p.id}" ${p.is_active ? 'checked' : ''} aria-label="Показывать на сайте"></td>
      <td class="nowrap">
        <button class="btn btn--sm" type="button" data-edit="${p.id}">Изменить</button>
        <button class="btn btn--sm btn--danger" type="button" data-del="${p.id}">Удалить</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" class="muted">Товаров пока нет</td></tr>';
}

// Наличие и видимость сохраняются сразу при изменении
$('#productsBody').addEventListener('change', async (e) => {
  const el = e.target;
  try {
    if (el.dataset.stock) {
      await adminApi(`/api/admin/products/${el.dataset.stock}`, { method: 'PATCH', body: { stock: Number(el.value) } });
      toast('Наличие обновлено');
    } else if (el.dataset.active) {
      await adminApi(`/api/admin/products/${el.dataset.active}`, { method: 'PATCH', body: { is_active: el.checked } });
      toast(el.checked ? 'Товар показан на сайте' : 'Товар скрыт с сайта');
    } else return;
    await Promise.all([loadProducts(), loadStats()]);
  } catch (ex) { toast(ex.message, true); }
});

$('#productsBody').addEventListener('click', async (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) return openProduct(products.find((p) => p.id === Number(edit.dataset.edit)));
  const del = e.target.closest('[data-del]');
  if (del) {
    const p = products.find((x) => x.id === Number(del.dataset.del));
    if (!confirm(`Удалить «${p.name}»? Можно вместо этого просто скрыть товар с сайта.`)) return;
    try {
      await adminApi(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      toast('Товар удалён');
      await loadProducts();
    } catch (ex) { toast(ex.message, true); }
  }
});

const pForm = $('#productForm');
$('#addProductBtn').addEventListener('click', () => openProduct(null));

function openProduct(p) {
  editingId = p ? p.id : null;
  $('#productTitle').textContent = p ? 'Редактирование товара' : 'Новый товар';
  $('#productError').hidden = true;
  const v = p || { name: '', category: 'fresh', unit: 'кг', description: '', price: '', stock: 0, step: 0.5, min_qty: 0.5, image: '', sort: 0, is_active: 1 };
  for (const k of ['name', 'category', 'unit', 'description', 'price', 'stock', 'step', 'min_qty', 'image', 'sort']) pForm[k].value = v[k];
  pForm.is_active.checked = !!v.is_active;
  $('#photoFile').value = '';
  updatePreview();
  openLayer($('#productModal'));
}

function updatePreview() {
  const img = $('#photoPreview');
  if (pForm.image.value) img.src = pForm.image.value; else img.removeAttribute('src');
}
pForm.image.addEventListener('input', updatePreview);

// Для штучного товара шаг и минимум по умолчанию — 1
pForm.unit.addEventListener('change', () => {
  if (pForm.unit.value === 'шт') { pForm.step.value = 1; pForm.min_qty.value = 1; }
});

$('#photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const res = await adminApi('/api/admin/upload', { method: 'POST', body: file, headers: { 'Content-Type': file.type } });
    pForm.image.value = res.url;
    updatePreview();
  } catch (ex) { toast(ex.message, true); }
});

pForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(pForm));
  body.is_active = pForm.is_active.checked;
  try {
    await adminApi(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', { method: editingId ? 'PUT' : 'POST', body });
    closeLayer($('#productModal'));
    toast('Товар сохранён');
    await Promise.all([loadProducts(), loadStats()]);
  } catch (ex) {
    $('#productError').textContent = ex.message;
    $('#productError').hidden = false;
  }
});

// ---------- Настройки ----------

const sForm = $('#settingsForm');
async function loadSettings() {
  const s = await adminApi('/api/admin/settings');
  for (const [k, v] of Object.entries(s)) if (sForm[k]) sForm[k].value = v;
}
sForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await adminApi('/api/admin/settings', { method: 'PUT', body: Object.fromEntries(new FormData(sForm)) });
    toast('Настройки сохранены');
  } catch (ex) { toast(ex.message, true); }
});

// ---------- Старт ----------

api('/api/admin/me').then((r) => (r.admin ? showAdmin() : showLogin())).catch(showLogin);
