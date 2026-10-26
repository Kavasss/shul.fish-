// Общие функции для витрины и админки
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Локаль: на витрине — выбранный язык, в админке — польская
const curLocale = () => (typeof LANG !== 'undefined' ? LOCALES[LANG] : 'pl-PL');
// Суммы приходят с сервера в грошах
// Знак валюты везде «zł», разделители — по языку
const money = (grosze) => `${new Intl.NumberFormat(curLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grosze / 100)} zł`;
const fmtQty = (q) => new Intl.NumberFormat(curLocale(), { maximumFractionDigits: 3 }).format(q);
const $ = (sel, root = document) => root.querySelector(sel);

async function api(url, options = {}) {
  const lang = typeof LANG !== 'undefined' ? { 'X-Lang': LANG } : {};
  const opts = { ...options, headers: { 'X-Requested-With': 'fetch', ...lang, ...(options.headers || {}) } };
  if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof Blob)) {
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, opts);
  const data = res.headers.get('Content-Type')?.includes('json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Ошибка ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

let toastTimer;
function toast(text, isError = false) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.toggle('toast--error', isError);
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
}

function openLayer(el) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); }
function closeLayer(el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); }
document.addEventListener('click', (e) => {
  const layer = e.target.closest('.drawer, .modal');
  if (!layer) return;
  if (e.target === layer || e.target.closest('[data-close]')) closeLayer(layer);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.drawer.open, .modal.open').forEach(closeLayer);
});
