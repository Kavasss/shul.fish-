// Вход, регистрация и личный кабинет покупателя
let currentUser = null;
let authMode = 'login'; // 'login' | 'register'

async function loadUser() {
  try {
    currentUser = (await api('/api/auth/me')).user;
  } catch { currentUser = null; }
  renderAccountUi();
}

// Кнопка в шапке и подсказка в оформлении заказа
function renderAccountUi() {
  const btn = $('#accountBtn');
  btn.classList.toggle('is-in', !!currentUser);
  $('#accountLabel').textContent = currentUser ? currentUser.name || currentUser.email : t('sign_in');
  btn.setAttribute('aria-label', currentUser ? t('account') : t('sign_in'));
  $('#checkoutLogin').hidden = !!currentUser;
  if (currentUser) $('#accountHello').textContent = t('hello', { name: currentUser.name || currentUser.email });
  renderAuthMode();
}

// ---------- Окно входа / регистрации ----------

function renderAuthMode() {
  const reg = authMode === 'register';
  $('#authTitle').textContent = reg ? t('sign_up') : t('sign_in');
  $('#authSubmit').textContent = reg ? t('create_account') : t('sign_in');
  $('#authSwitch').textContent = reg ? t('auth_switch_login') : t('auth_switch_reg');
  $('#authPassword').autocomplete = reg ? 'new-password' : 'current-password';
  document.querySelectorAll('[data-reg-only]').forEach((el) => { el.hidden = !reg; });
}

function openAuth(mode = 'login') {
  authMode = mode;
  $('#authError').hidden = true;
  renderAuthMode();
  openLayer($('#authModal'));
  setTimeout(() => (mode === 'register' ? $('#authName') : $('#authEmail')).focus(), 50);
}

$('#accountBtn').addEventListener('click', () => (currentUser ? openAccount() : openAuth('login')));
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-auth]')) openAuth('login');
});
$('#authSwitch').addEventListener('click', () => {
  authMode = authMode === 'login' ? 'register' : 'login';
  $('#authError').hidden = true;
  renderAuthMode();
});

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#authError');
  err.hidden = true;
  const data = Object.fromEntries(new FormData(e.target));
  const btn = $('#authSubmit');
  btn.disabled = true;
  try {
    const url = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = authMode === 'register' ? data : { email: data.email, password: data.password };
    currentUser = (await api(url, { method: 'POST', body })).user;
    e.target.reset();
    closeLayer($('#authModal'));
    toast(authMode === 'register' ? t('signed_up') : t('logged_in'));
    renderAccountUi();
    // Если покупатель вошёл из оформления заказа — заполняем форму
    if ($('#checkout').classList.contains('open')) fillCheckoutFromUser();
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

// Подставляет данные профиля в пустые поля формы заказа
function fillCheckoutFromUser() {
  if (!currentUser) return;
  const f = $('#orderForm');
  if (!f.name.value) f.name.value = currentUser.name;
  if (!f.phone.value) f.phone.value = currentUser.phone;
  if (!f.email.value) f.email.value = currentUser.email;
  if (!f.address.value) f.address.value = currentUser.address;
}

// ---------- Личный кабинет ----------

function openAccount() {
  showAccountTab('orders');
  const f = $('#profileForm');
  f.name.value = currentUser.name;
  f.phone.value = currentUser.phone;
  f.address.value = currentUser.address;
  $('#profEmail').value = currentUser.email;
  openLayer($('#accountModal'));
}

function showAccountTab(tab) {
  document.querySelectorAll('[data-acc-tab]').forEach((b) => b.classList.toggle('active', b.dataset.accTab === tab));
  document.querySelectorAll('[data-acc-panel]').forEach((p) => { p.hidden = p.dataset.accPanel !== tab; });
  if (tab === 'orders') loadMyOrders();
}

$('#accountTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-acc-tab]');
  if (b) showAccountTab(b.dataset.accTab);
});

async function loadMyOrders() {
  const box = $('#accountOrders');
  box.innerHTML = `<p class="muted">${esc(t('loading'))}</p>`;
  try {
    const orders = await api('/api/account/orders');
    if (!orders.length) { box.innerHTML = `<p class="muted">${esc(t('no_orders'))}</p>`; return; }
    const unitName = (u) => t(u === 'pcs' ? 'unit_pcs' : 'unit_kg');
    box.innerHTML = orders.map((o) => `
      <article class="order-card">
        <div class="order-card__head">
          <b>${esc(t('order_n', { id: o.id }))}</b>
          <span class="muted small">${esc(new Date(o.created_at.replace(' ', 'T') + 'Z').toLocaleDateString(LOCALES[LANG]))}</span>
          <span class="order-status order-status--${o.status}">${esc(t(`status_${o.status}`))}</span>
        </div>
        <ul class="order-card__items">
          ${o.items.map((i) => `<li><span>${esc(tr(i.name))} · ${fmtQty(i.qty)} ${esc(unitName(i.unit))}</span><span>${money(i.sum)}</span></li>`).join('')}
        </ul>
        <div class="row row--total"><span>${esc(t('total'))}</span><span>${money(o.total)}</span></div>
      </article>`).join('');
  } catch (ex) {
    box.innerHTML = `<p class="error">${esc(ex.message)}</p>`;
    if (ex.status === 401) { currentUser = null; renderAccountUi(); }
  }
}

$('#profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    currentUser = (await api('/api/account', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) })).user;
    renderAccountUi();
    toast(t('saved'));
  } catch (ex) { toast(ex.message, true); }
});

$('#passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/account/password', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
    e.target.reset();
    toast(t('password_changed'));
  } catch (ex) { toast(ex.message, true); }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  currentUser = null;
  closeLayer($('#accountModal'));
  renderAccountUi();
  toast(t('logged_out'));
});
