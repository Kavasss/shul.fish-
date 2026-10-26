// Витрина: каталог, корзина, оформление заказа
const CART_KEY = 'fish_cart';
let products = [];
let settings = {};
let category = 'all';
let cart = loadCart(); // [{id, qty}]
let cartView = { items: [], items_total: 0, delivery_cost: 0 };

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* приватный режим */ }
}

async function init() {
  [settings, products] = await Promise.all([api('/api/settings'), api('/api/products')]);
  document.title = `${settings.shop_name} — свежая, копчёная и солёная рыба с доставкой`;
  $('#shopName').textContent = settings.shop_name;
  $('#footerName').textContent = settings.shop_name;
  $('#year').textContent = new Date().getFullYear();
  $('#shopPhone').textContent = settings.shop_phone;
  $('#shopPhone').href = `tel:${settings.shop_phone.replace(/[^\d+]/g, '')}`;
  const free = settings.free_delivery_from ? `, бесплатно от ${money(settings.free_delivery_from)}` : '';
  $('#deliveryInfo').textContent = `Доставка ${money(settings.delivery_cost)}${free}`;
  $('#infoCourier').textContent = `${settings.delivery_note} Стоимость — ${money(settings.delivery_cost)}${free}.`;
  $('#infoPickup').textContent = `Бесплатно: ${settings.pickup_address}`;
  $('#pickupAddr').textContent = `Адрес самовывоза: ${settings.pickup_address}`;
  renderProducts();
  await syncCart();
}

// ---------- Каталог ----------

function renderProducts() {
  const list = products.filter((p) => category === 'all' || p.category === category);
  const el = $('#products');
  if (!list.length) { el.innerHTML = '<p class="muted">В этой категории пока нет товаров.</p>'; return; }
  el.innerHTML = list.map((p) => {
    const inCart = cart.find((c) => c.id === p.id);
    const action = !p.available
      ? '<span class="badge badge--out">Нет в наличии</span>'
      : inCart
        ? `<div class="stepper" data-id="${p.id}">
             <button type="button" data-act="dec" aria-label="Меньше">−</button>
             <span>${fmtQty(inCart.qty)} ${esc(p.unit)}</span>
             <button type="button" data-act="inc" aria-label="Больше">+</button>
           </div>`
        : `<button class="btn btn--primary" type="button" data-add="${p.id}">В корзину</button>`;
    return `
      <article class="card${p.available ? '' : ' card--out'}">
        <div class="card__img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : ''}
          <span class="card__cat card__cat--${p.category}">${esc(settings.categories[p.category])}</span></div>
        <div class="card__body">
          <h3>${esc(p.name)}</h3>
          <p class="muted small">${esc(p.description)}</p>
          <div class="card__foot">
            <div class="price">${money(p.price)}<small> / ${esc(p.unit)}</small></div>
            ${action}
          </div>
        </div>
      </article>`;
  }).join('');
}

$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  category = btn.dataset.cat;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
  renderProducts();
});

function changeQty(id, dir) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const item = cart.find((c) => c.id === id);
  if (!item) {
    if (dir > 0) cart.push({ id, qty: p.min_qty });
  } else {
    const next = Math.round((item.qty + dir * p.step) * 1000) / 1000;
    if (next < p.min_qty) cart = cart.filter((c) => c.id !== id);
    else item.qty = next;
  }
  syncCart(id);
}

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) return changeQty(Number(add.dataset.add), 1);
  const step = e.target.closest('.stepper [data-act]');
  if (step) return changeQty(Number(step.closest('.stepper').dataset.id), step.dataset.act === 'inc' ? 1 : -1);
  const rm = e.target.closest('[data-remove]');
  if (rm) { cart = cart.filter((c) => c.id !== Number(rm.dataset.remove)); syncCart(); }
});

// ---------- Корзина ----------

// Сверяет корзину с сервером: сервер сам ограничивает количество доступным для заказа
async function syncCart(changedId) {
  try {
    cartView = await api('/api/cart/check', { method: 'POST', body: { items: cart, delivery_method: deliveryMethod() } });
  } catch (e) {
    toast(e.message, true);
    return;
  }
  const next = [];
  for (const i of cartView.items) {
    if (i.removed || i.unavailable) {
      if (i.id === changedId || !changedId) toast(i.name ? `«${i.name}» сейчас нет в наличии` : 'Товар больше не продаётся', true);
      // обновим карточку, если товар закончился
      const p = products.find((x) => x.id === i.id);
      if (p && i.unavailable) p.available = false;
      continue;
    }
    if (i.limited && i.id === changedId) toast(`Больше «${i.name}» заказать сейчас нельзя`);
    next.push({ id: i.id, qty: i.qty });
  }
  cart = next;
  cartView.items = cartView.items.filter((i) => !i.removed && !i.unavailable);
  saveCart();
  renderProducts();
  renderCart();
}

function renderCart() {
  const count = cart.length;
  $('#cartCount').textContent = count;
  $('#cartCount').hidden = count === 0;
  const box = $('#cartItems');
  if (!count) {
    box.innerHTML = '<p class="muted">Корзина пуста</p>';
  } else {
    box.innerHTML = cartView.items.map((i) => `
      <div class="cart-item">
        ${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div></div>'}
        <div>
          <div class="cart-item__name">${esc(i.name)}</div>
          <div class="muted small">${money(i.price)} / ${esc(i.unit)}</div>
          <div class="stepper stepper--small" data-id="${i.id}">
            <button type="button" data-act="dec" aria-label="Меньше">−</button>
            <span>${fmtQty(i.qty)} ${esc(i.unit)}</span>
            <button type="button" data-act="inc" aria-label="Больше">+</button>
          </div>
        </div>
        <div class="cart-item__right">
          <b>${money(i.sum)}</b>
          <button class="link-btn" type="button" data-remove="${i.id}">Удалить</button>
        </div>
      </div>`).join('');
  }
  $('#cartTotal').textContent = money(cartView.items_total);
  const minOrder = settings.min_order || 0;
  const hints = [];
  if (count && cartView.items_total < minOrder) hints.push(`Минимальная сумма заказа — ${money(minOrder)}`);
  if (settings.free_delivery_from && cartView.items_total < settings.free_delivery_from && count) {
    hints.push(`До бесплатной доставки: ${money(settings.free_delivery_from - cartView.items_total)}`);
  }
  hints.push('Вес рыбы может немного отличаться, итоговая сумма уточняется при подтверждении заказа.');
  $('#cartHint').textContent = hints.join('. ');
  $('#checkoutBtn').disabled = !count || cartView.items_total < minOrder;
  renderSummary();
}

$('#cartBtn').addEventListener('click', () => openLayer($('#cart')));

// ---------- Оформление ----------

const form = $('#orderForm');
function deliveryMethod() {
  return form.querySelector('[name=delivery_method]:checked')?.value || 'courier';
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setupCheckout() {
  const date = form.delivery_date;
  const today = new Date();
  const max = new Date(); max.setDate(max.getDate() + 14);
  date.min = isoDate(today);
  date.max = isoDate(max);
  if (!date.value) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    date.value = isoDate(tomorrow);
  }
  const sel = form.delivery_time;
  if (!sel.options.length) {
    sel.innerHTML = settings.delivery_slots.map((s) => `<option>${esc(s)}</option>`).join('');
  }
  updateMethod();
}

function updateMethod() {
  const courier = deliveryMethod() === 'courier';
  $('#addressField').hidden = !courier;
  $('#timeField').hidden = !courier || !settings.delivery_slots.length;
  $('#pickupAddr').hidden = courier;
  renderSummary();
}

function renderSummary() {
  const courier = deliveryMethod() === 'courier';
  const free = settings.free_delivery_from && cartView.items_total >= settings.free_delivery_from;
  const d = courier && !free ? settings.delivery_cost : 0;
  $('#sumItems').textContent = money(cartView.items_total);
  $('#sumDelivery').textContent = d ? money(d) : 'бесплатно';
  $('#sumTotal').textContent = money(cartView.items_total + d);
}

form.addEventListener('change', (e) => {
  if (e.target.name === 'delivery_method') updateMethod();
});

$('#checkoutBtn').addEventListener('click', () => {
  closeLayer($('#cart'));
  setupCheckout();
  $('#orderError').hidden = true;
  openLayer($('#checkout'));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#orderError');
  err.hidden = true;
  const data = Object.fromEntries(new FormData(form));
  if (deliveryMethod() === 'pickup') delete data.delivery_time;
  const btn = $('#submitOrder');
  btn.disabled = true;
  try {
    const res = await api('/api/orders', { method: 'POST', body: { ...data, items: cart } });
    cart = [];
    saveCart();
    form.reset();
    closeLayer($('#checkout'));
    $('#successText').textContent = `Заказ №${res.id} на сумму ${money(res.total)} принят. Мы позвоним вам для подтверждения.`;
    openLayer($('#success'));
    products = await api('/api/products');
    await syncCart();
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
    if (ex.status === 409) await syncCart();
  } finally {
    btn.disabled = false;
  }
});

init().catch((e) => {
  $('#products').innerHTML = `<p class="error">Не удалось загрузить каталог: ${esc(e.message)}</p>`;
});
