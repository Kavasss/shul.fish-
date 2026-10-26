// Переводы интерфейса витрины. Язык по умолчанию — польский.
const I18N = {
  pl: {
    meta_title: 'Shul.Fish — ryby świeże, wędzone i solone z dostawą',
    nav_catalog: 'Katalog', nav_delivery: 'Dostawa', cart: 'Koszyk',
    hero_eyebrow: 'Świeże · Wędzone · Solone',
    hero_title_1: 'Ryby, które', hero_title_2: 'chce się gotować',
    hero_lead: 'Świeży połów, własna wędzarnia i solenie. Dowieziemy pod drzwi w wygodnym przedziale czasowym.',
    hero_cta: 'Przejdź do katalogu',
    feat1_b: 'Codziennie', feat1_s: 'świeże dostawy',
    feat2_b: 'Zrębki olchowe', feat2_s: 'naturalne wędzenie',
    feat3_b: 'Torby termiczne', feat3_s: 'łańcuch chłodniczy do drzwi',
    feat4_b: 'Przy odbiorze', feat4_s: 'płatność kartą lub gotówką',
    catalog: 'Katalog', cat_all: 'Wszystkie', cat_fresh: 'Świeże', cat_smoked: 'Wędzone', cat_salted: 'Solone',
    delivery_title: 'Dostawa i płatność', courier: 'Kurierem', pickup: 'Odbiór osobisty', payment: 'Płatność',
    payment_text: 'Gotówką lub kartą przy odbiorze zamówienia.',
    cart_title: 'Koszyk', items: 'Produkty', checkout: 'Złóż zamówienie', checkout_title: 'Składanie zamówienia',
    name: 'Imię*', phone: 'Telefon*', email: 'E-mail', delivery_method: 'Sposób odbioru',
    by_courier: 'Dostawa kurierem', self_pickup: 'Odbiór osobisty', address: 'Adres dostawy*',
    address_ph: 'Ulica, numer domu i mieszkania, klatka, piętro', date: 'Data*', time: 'Godzina*',
    payment_on_receipt: 'Płatność przy odbiorze', cash: 'Gotówką', card: 'Kartą',
    comment: 'Komentarz', comment_ph: 'Np. wypatroszyć rybę, zadzwonić godzinę wcześniej',
    delivery: 'Dostawa', total: 'Razem', confirm: 'Potwierdź zamówienie',
    thanks: 'Dziękujemy za zamówienie!', ok: 'OK', loading: 'Ładowanie…',
    add_to_cart: 'Do koszyka', out_of_stock: 'Brak w magazynie', cart_empty: 'Koszyk jest pusty', remove: 'Usuń',
    unit_kg: 'kg', unit_pcs: 'szt.', less: 'Mniej', more: 'Więcej', close: 'Zamknij', free: 'za darmo',
    delivery_info: 'Dostawa {cost}', free_from: ', za darmo od {sum}',
    courier_info: '{note} Koszt — {cost}{free}.', pickup_info: 'Bezpłatnie: {addr}', pickup_addr: 'Adres odbioru: {addr}',
    min_order_hint: 'Minimalna wartość zamówienia — {sum}', free_left: 'Do darmowej dostawy brakuje: {sum}',
    weight_note: 'Waga ryby może się nieznacznie różnić, ostateczna kwota zostanie potwierdzona telefonicznie.',
    success_text: 'Zamówienie nr {id} na kwotę {sum} zostało przyjęte. Zadzwonimy, aby je potwierdzić.',
    no_items_cat: 'W tej kategorii nie ma jeszcze produktów.', load_error: 'Nie udało się wczytać katalogu: {err}',
    limited: 'Nie można teraz zamówić więcej „{name}”', unavailable: '„{name}” jest obecnie niedostępny',
    not_sold: 'Produkt nie jest już dostępny', phone_ph: '+48 500 000 000',
  },
  en: {
    meta_title: 'Shul.Fish — fresh, smoked and salted fish delivered',
    nav_catalog: 'Catalogue', nav_delivery: 'Delivery', cart: 'Cart',
    hero_eyebrow: 'Fresh · Smoked · Salted',
    hero_title_1: 'Fish that makes', hero_title_2: 'you want to cook',
    hero_lead: 'Fresh catch, our own smokehouse and curing. Delivered to your door at a time that suits you.',
    hero_cta: 'Browse the catalogue',
    feat1_b: 'Every day', feat1_s: 'fresh deliveries',
    feat2_b: 'Alder chips', feat2_s: 'natural smoking',
    feat3_b: 'Thermal bags', feat3_s: 'cold chain to your door',
    feat4_b: 'On delivery', feat4_s: 'pay by card or cash',
    catalog: 'Catalogue', cat_all: 'All', cat_fresh: 'Fresh', cat_smoked: 'Smoked', cat_salted: 'Salted',
    delivery_title: 'Delivery & payment', courier: 'By courier', pickup: 'Pickup', payment: 'Payment',
    payment_text: 'Cash or card when you receive your order.',
    cart_title: 'Cart', items: 'Items', checkout: 'Checkout', checkout_title: 'Checkout',
    name: 'Name*', phone: 'Phone*', email: 'E-mail', delivery_method: 'Delivery method',
    by_courier: 'Courier delivery', self_pickup: 'Pickup', address: 'Delivery address*',
    address_ph: 'Street, building, flat, entrance, floor', date: 'Date*', time: 'Time*',
    payment_on_receipt: 'Payment on delivery', cash: 'Cash', card: 'Card',
    comment: 'Comment', comment_ph: 'E.g. clean the fish, call an hour ahead',
    delivery: 'Delivery', total: 'Total', confirm: 'Place order',
    thanks: 'Thank you for your order!', ok: 'OK', loading: 'Loading…',
    add_to_cart: 'Add to cart', out_of_stock: 'Out of stock', cart_empty: 'Your cart is empty', remove: 'Remove',
    unit_kg: 'kg', unit_pcs: 'pcs', less: 'Less', more: 'More', close: 'Close', free: 'free',
    delivery_info: 'Delivery {cost}', free_from: ', free over {sum}',
    courier_info: '{note} Cost — {cost}{free}.', pickup_info: 'Free: {addr}', pickup_addr: 'Pickup address: {addr}',
    min_order_hint: 'Minimum order value — {sum}', free_left: 'Add {sum} more for free delivery',
    weight_note: 'Fish weight may vary slightly; the final amount is confirmed by phone.',
    success_text: 'Order #{id} for {sum} has been received. We will call you to confirm it.',
    no_items_cat: 'No products in this category yet.', load_error: 'Could not load the catalogue: {err}',
    limited: 'You cannot order more “{name}” right now', unavailable: '“{name}” is currently out of stock',
    not_sold: 'This product is no longer available', phone_ph: '+48 500 000 000',
  },
  ru: {
    meta_title: 'Shul.Fish — свежая, копчёная и солёная рыба с доставкой',
    nav_catalog: 'Каталог', nav_delivery: 'Доставка', cart: 'Корзина',
    hero_eyebrow: 'Свежая · Копчёная · Солёная',
    hero_title_1: 'Рыба, которую', hero_title_2: 'хочется готовить',
    hero_lead: 'Свежий улов, собственное копчение и засолка. Привезём к двери в удобный интервал.',
    hero_cta: 'Перейти в каталог',
    feat1_b: 'Каждый день', feat1_s: 'свежие поставки',
    feat2_b: 'Ольховая щепа', feat2_s: 'натуральное копчение',
    feat3_b: 'Термопакеты', feat3_s: 'холодовая цепь до двери',
    feat4_b: 'При получении', feat4_s: 'оплата картой или наличными',
    catalog: 'Каталог', cat_all: 'Все', cat_fresh: 'Свежая', cat_smoked: 'Копчёная', cat_salted: 'Солёная',
    delivery_title: 'Доставка и оплата', courier: 'Курьером', pickup: 'Самовывоз', payment: 'Оплата',
    payment_text: 'Наличными или картой при получении заказа.',
    cart_title: 'Корзина', items: 'Товары', checkout: 'Оформить заказ', checkout_title: 'Оформление заказа',
    name: 'Имя*', phone: 'Телефон*', email: 'E-mail', delivery_method: 'Способ получения',
    by_courier: 'Доставка курьером', self_pickup: 'Самовывоз', address: 'Адрес доставки*',
    address_ph: 'Улица, дом, квартира, подъезд, этаж', date: 'Дата*', time: 'Время*',
    payment_on_receipt: 'Оплата при получении', cash: 'Наличными', card: 'Картой',
    comment: 'Комментарий', comment_ph: 'Например: разделать рыбу, позвонить за час',
    delivery: 'Доставка', total: 'Итого', confirm: 'Подтвердить заказ',
    thanks: 'Спасибо за заказ!', ok: 'Хорошо', loading: 'Загрузка…',
    add_to_cart: 'В корзину', out_of_stock: 'Нет в наличии', cart_empty: 'Корзина пуста', remove: 'Удалить',
    unit_kg: 'кг', unit_pcs: 'шт', less: 'Меньше', more: 'Больше', close: 'Закрыть', free: 'бесплатно',
    delivery_info: 'Доставка {cost}', free_from: ', бесплатно от {sum}',
    courier_info: '{note} Стоимость — {cost}{free}.', pickup_info: 'Бесплатно: {addr}', pickup_addr: 'Адрес самовывоза: {addr}',
    min_order_hint: 'Минимальная сумма заказа — {sum}', free_left: 'До бесплатной доставки: {sum}',
    weight_note: 'Вес рыбы может немного отличаться, итоговая сумма уточняется при подтверждении заказа.',
    success_text: 'Заказ №{id} на сумму {sum} принят. Мы позвоним вам для подтверждения.',
    no_items_cat: 'В этой категории пока нет товаров.', load_error: 'Не удалось загрузить каталог: {err}',
    limited: 'Больше «{name}» заказать сейчас нельзя', unavailable: '«{name}» сейчас нет в наличии',
    not_sold: 'Товар больше не продаётся', phone_ph: '+48 500 000 000',
  },
  uk: {
    meta_title: 'Shul.Fish — свіжа, копчена та солона риба з доставкою',
    nav_catalog: 'Каталог', nav_delivery: 'Доставка', cart: 'Кошик',
    hero_eyebrow: 'Свіжа · Копчена · Солона',
    hero_title_1: 'Риба, яку', hero_title_2: 'хочеться готувати',
    hero_lead: 'Свіжий вилов, власне копчення та засолювання. Привеземо до дверей у зручний час.',
    hero_cta: 'Перейти до каталогу',
    feat1_b: 'Щодня', feat1_s: 'свіжі поставки',
    feat2_b: 'Вільхова тріска', feat2_s: 'натуральне копчення',
    feat3_b: 'Термопакети', feat3_s: 'холодовий ланцюг до дверей',
    feat4_b: 'При отриманні', feat4_s: 'оплата карткою або готівкою',
    catalog: 'Каталог', cat_all: 'Усі', cat_fresh: 'Свіжа', cat_smoked: 'Копчена', cat_salted: 'Солона',
    delivery_title: 'Доставка та оплата', courier: 'Кур’єром', pickup: 'Самовивіз', payment: 'Оплата',
    payment_text: 'Готівкою або карткою при отриманні замовлення.',
    cart_title: 'Кошик', items: 'Товари', checkout: 'Оформити замовлення', checkout_title: 'Оформлення замовлення',
    name: 'Ім’я*', phone: 'Телефон*', email: 'E-mail', delivery_method: 'Спосіб отримання',
    by_courier: 'Доставка кур’єром', self_pickup: 'Самовивіз', address: 'Адреса доставки*',
    address_ph: 'Вулиця, будинок, квартира, під’їзд, поверх', date: 'Дата*', time: 'Час*',
    payment_on_receipt: 'Оплата при отриманні', cash: 'Готівкою', card: 'Карткою',
    comment: 'Коментар', comment_ph: 'Наприклад: розібрати рибу, зателефонувати за годину',
    delivery: 'Доставка', total: 'Разом', confirm: 'Підтвердити замовлення',
    thanks: 'Дякуємо за замовлення!', ok: 'Добре', loading: 'Завантаження…',
    add_to_cart: 'У кошик', out_of_stock: 'Немає в наявності', cart_empty: 'Кошик порожній', remove: 'Видалити',
    unit_kg: 'кг', unit_pcs: 'шт', less: 'Менше', more: 'Більше', close: 'Закрити', free: 'безкоштовно',
    delivery_info: 'Доставка {cost}', free_from: ', безкоштовно від {sum}',
    courier_info: '{note} Вартість — {cost}{free}.', pickup_info: 'Безкоштовно: {addr}', pickup_addr: 'Адреса самовивозу: {addr}',
    min_order_hint: 'Мінімальна сума замовлення — {sum}', free_left: 'До безкоштовної доставки: {sum}',
    weight_note: 'Вага риби може трохи відрізнятися, остаточна сума уточнюється під час підтвердження.',
    success_text: 'Замовлення №{id} на суму {sum} прийнято. Ми зателефонуємо для підтвердження.',
    no_items_cat: 'У цій категорії поки немає товарів.', load_error: 'Не вдалося завантажити каталог: {err}',
    limited: 'Більше «{name}» замовити зараз не можна', unavailable: '«{name}» зараз немає в наявності',
    not_sold: 'Товар більше не продається', phone_ph: '+48 500 000 000',
  },
};
const LANG_LABELS = { pl: 'PL', en: 'EN', ru: 'RU', uk: 'UA' };
const LOCALES = { pl: 'pl-PL', en: 'en-GB', ru: 'ru-RU', uk: 'uk-UA' };
const LANG_KEY = 'fish_lang';

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (I18N[saved]) return saved;
  } catch { /* приватный режим */ }
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (I18N[fromUrl]) return fromUrl;
  for (const l of navigator.languages || [navigator.language]) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (I18N[code]) return code;
  }
  return 'pl';
}

let LANG = detectLang();

function t(key, params = {}) {
  const text = I18N[LANG][key] ?? I18N.pl[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
}

// Текст из многоязычного поля товара: {pl, en, ru, uk}
function tr(obj) {
  if (!obj || typeof obj !== 'object') return String(obj ?? '');
  return obj[LANG] || obj.pl || Object.values(obj).find(Boolean) || '';
}

function setLang(lang) {
  LANG = I18N[lang] ? lang : 'pl';
  try { localStorage.setItem(LANG_KEY, LANG); } catch { /* приватный режим */ }
  applyI18n();
}

// Переводит статические элементы страницы с атрибутами data-i18n / data-i18n-placeholder / data-i18n-aria
function applyI18n() {
  document.documentElement.lang = LANG;
  document.title = t('meta_title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-lang]').forEach((el) => el.classList.toggle('active', el.dataset.lang === LANG));
}

// Вход, регистрация и личный кабинет
Object.assign(I18N.pl, {
  sign_in: 'Zaloguj się', sign_up: 'Rejestracja', account: 'Konto', logout: 'Wyloguj się',
  password: 'Hasło*', password_hint: 'co najmniej 8 znaków', create_account: 'Załóż konto',
  auth_switch_reg: 'Nie masz konta? Zarejestruj się', auth_switch_login: 'Masz już konto? Zaloguj się',
  auth_why: 'Konto zapamięta Twoje dane do dostawy i pokaże historię zamówień.',
  hello: 'Dzień dobry, {name}!', profile: 'Moje dane', my_orders: 'Moje zamówienia', address_default: 'Adres dostawy',
  save: 'Zapisz', saved: 'Zapisano', change_password: 'Zmiana hasła', current_password: 'Obecne hasło',
  new_password: 'Nowe hasło', password_changed: 'Hasło zostało zmienione', no_orders: 'Nie masz jeszcze zamówień.',
  order_n: 'Zamówienie nr {id}', checkout_login: 'Masz konto? Zaloguj się, a formularz wypełni się automatycznie.',
  logged_in: 'Zalogowano', logged_out: 'Wylogowano', signed_up: 'Konto zostało utworzone',
  status_new: 'Nowe', status_confirmed: 'Potwierdzone', status_delivering: 'W dostawie', status_done: 'Zrealizowane', status_cancelled: 'Anulowane',
});
Object.assign(I18N.en, {
  sign_in: 'Sign in', sign_up: 'Sign up', account: 'Account', logout: 'Sign out',
  password: 'Password*', password_hint: 'at least 8 characters', create_account: 'Create account',
  auth_switch_reg: 'No account yet? Sign up', auth_switch_login: 'Already have an account? Sign in',
  auth_why: 'Your account remembers your delivery details and shows your order history.',
  hello: 'Hello, {name}!', profile: 'My details', my_orders: 'My orders', address_default: 'Delivery address',
  save: 'Save', saved: 'Saved', change_password: 'Change password', current_password: 'Current password',
  new_password: 'New password', password_changed: 'Password changed', no_orders: 'You have no orders yet.',
  order_n: 'Order #{id}', checkout_login: 'Have an account? Sign in and the form will fill itself in.',
  logged_in: 'Signed in', logged_out: 'Signed out', signed_up: 'Account created',
  status_new: 'New', status_confirmed: 'Confirmed', status_delivering: 'Out for delivery', status_done: 'Completed', status_cancelled: 'Cancelled',
});
Object.assign(I18N.ru, {
  sign_in: 'Войти', sign_up: 'Регистрация', account: 'Кабинет', logout: 'Выйти',
  password: 'Пароль*', password_hint: 'не короче 8 символов', create_account: 'Создать аккаунт',
  auth_switch_reg: 'Нет аккаунта? Зарегистрируйтесь', auth_switch_login: 'Уже есть аккаунт? Войдите',
  auth_why: 'Аккаунт запомнит данные для доставки и покажет историю заказов.',
  hello: 'Здравствуйте, {name}!', profile: 'Мои данные', my_orders: 'Мои заказы', address_default: 'Адрес доставки',
  save: 'Сохранить', saved: 'Сохранено', change_password: 'Смена пароля', current_password: 'Текущий пароль',
  new_password: 'Новый пароль', password_changed: 'Пароль изменён', no_orders: 'У вас пока нет заказов.',
  order_n: 'Заказ №{id}', checkout_login: 'Есть аккаунт? Войдите, и форма заполнится сама.',
  logged_in: 'Вы вошли', logged_out: 'Вы вышли', signed_up: 'Аккаунт создан',
  status_new: 'Новый', status_confirmed: 'Подтверждён', status_delivering: 'Доставляется', status_done: 'Выполнен', status_cancelled: 'Отменён',
});
Object.assign(I18N.uk, {
  sign_in: 'Увійти', sign_up: 'Реєстрація', account: 'Кабінет', logout: 'Вийти',
  password: 'Пароль*', password_hint: 'щонайменше 8 символів', create_account: 'Створити акаунт',
  auth_switch_reg: 'Немає акаунта? Зареєструйтеся', auth_switch_login: 'Уже маєте акаунт? Увійдіть',
  auth_why: 'Акаунт запам’ятає дані для доставки й покаже історію замовлень.',
  hello: 'Вітаємо, {name}!', profile: 'Мої дані', my_orders: 'Мої замовлення', address_default: 'Адреса доставки',
  save: 'Зберегти', saved: 'Збережено', change_password: 'Зміна пароля', current_password: 'Поточний пароль',
  new_password: 'Новий пароль', password_changed: 'Пароль змінено', no_orders: 'У вас поки немає замовлень.',
  order_n: 'Замовлення №{id}', checkout_login: 'Маєте акаунт? Увійдіть, і форма заповниться сама.',
  logged_in: 'Ви увійшли', logged_out: 'Ви вийшли', signed_up: 'Акаунт створено',
  status_new: 'Нове', status_confirmed: 'Підтверджене', status_delivering: 'Доставляється', status_done: 'Виконане', status_cancelled: 'Скасоване',
});
