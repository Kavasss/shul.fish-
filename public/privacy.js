// Политика конфиденциальности (RODO / GDPR) на 4 языках.
// Реквизиты продавца подставляются из настроек магазина: {company}, {address}, {nip}, {email}, {phone}, {pickup}.
// Обязательную силу имеет польская версия.
const POLICY = {
  pl: {
    title: 'Polityka prywatności',
    updated: 'Obowiązuje od: {date}',
    back: '← Wróć do sklepu',
    note: '',
    sections: [
      ['1. Administrator danych', [
        'Administratorem Twoich danych osobowych jest {company}, {address}, NIP: {nip} (dalej: „Sklep”).',
        'Kontakt w sprawach danych osobowych: e-mail {email}, telefon {phone} lub formularz kontaktowy na stronie.',
      ]],
      ['2. Jakie dane przetwarzamy', [
        'Przy zamówieniu: imię, numer telefonu, adres e-mail (opcjonalnie), adres dostawy, termin dostawy, komentarz oraz treść zamówienia.',
        'Przy zakładaniu konta: imię, adres e-mail, hasło (przechowujemy wyłącznie jego zabezpieczony skrót), telefon i adres dostawy, jeśli je podasz.',
        'W formularzu kontaktowym: imię, adres e-mail, telefon (opcjonalnie) i treść wiadomości.',
        'Dane techniczne: adres IP – wyłącznie w celu ochrony przed nadużyciami (np. ograniczenia liczby prób logowania); nie zapisujemy go w bazie danych.',
      ]],
      ['3. Cele i podstawy prawne', [
        'Realizacja zamówienia i dostawy, kontakt w sprawie zamówienia – art. 6 ust. 1 lit. b RODO (wykonanie umowy).',
        'Prowadzenie konta klienta i historii zamówień – art. 6 ust. 1 lit. b RODO (umowa o świadczenie usługi konta).',
        'Odpowiedź na wiadomość z formularza kontaktowego – art. 6 ust. 1 lit. a RODO (zgoda) oraz lit. f (prawnie uzasadniony interes – obsługa zapytań).',
        'Wystawianie dokumentów sprzedaży i prowadzenie księgowości – art. 6 ust. 1 lit. c RODO (obowiązek prawny).',
        'Ustalenie, dochodzenie i obrona roszczeń oraz bezpieczeństwo serwisu – art. 6 ust. 1 lit. f RODO.',
      ]],
      ['4. Jak długo przechowujemy dane', [
        'Dane zamówień – przez okres wymagany przepisami podatkowymi (5 lat od końca roku kalendarzowego, w którym powstał obowiązek podatkowy) oraz do czasu przedawnienia roszczeń.',
        'Dane konta – do czasu jego usunięcia. Konto możesz usunąć samodzielnie w zakładce „Moje dane”; zamówienia pozostają wtedy w systemie bez powiązania z kontem, wyłącznie na potrzeby księgowe.',
        'Wiadomości z formularza kontaktowego – do 12 miesięcy od zakończenia sprawy lub do wycofania zgody.',
      ]],
      ['5. Odbiorcy danych', [
        'Dane mogą otrzymać wyłącznie podmioty, które pomagają nam prowadzić sklep: kurierzy i firmy dostawcze (w zakresie potrzebnym do dostawy), dostawca hostingu, biuro rachunkowe oraz dostawcy narzędzi IT, w tym komunikatora służącego do powiadomień o nowych zamówieniach.',
        'Jeżeli którykolwiek z dostawców przetwarza dane poza Europejskim Obszarem Gospodarczym, odbywa się to na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską lub innego mechanizmu przewidzianego w RODO.',
        'Nie sprzedajemy danych i nie przekazujemy ich w celach marketingowych.',
      ]],
      ['6. Twoje prawa', [
        'Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz prawo sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.',
        'Zgodę możesz wycofać w dowolnym momencie; nie wpływa to na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.',
        'Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).',
        'Aby skorzystać z praw, napisz na {email} lub przez formularz kontaktowy.',
      ]],
      ['7. Pliki cookies i pamięć przeglądarki', [
        'Używamy wyłącznie niezbędnych plików cookies: cookie sesji logowania klienta (ważne 30 dni) oraz cookie sesji panelu administratora.',
        'W pamięci przeglądarki (localStorage) zapisujemy zawartość koszyka i wybrany język. Dane te nie opuszczają Twojego urządzenia, dopóki nie złożysz zamówienia.',
        'Nie stosujemy cookies analitycznych ani reklamowych. Czcionki są ładowane z naszego serwera, bez łączenia się z zewnętrznymi usługami.',
      ]],
      ['8. Dobrowolność i zmiany', [
        'Podanie danych jest dobrowolne, ale niezbędne do realizacji zamówienia, założenia konta lub otrzymania odpowiedzi na wiadomość.',
        'Nie podejmujemy decyzji w sposób zautomatyzowany i nie profilujemy klientów.',
        'O zmianach tej polityki poinformujemy na tej stronie, aktualizując datę obowiązywania.',
      ]],
    ],
  },
  en: {
    title: 'Privacy policy',
    updated: 'Effective from: {date}',
    back: '← Back to the shop',
    note: 'This is a translation. In case of discrepancies, the Polish version prevails.',
    sections: [
      ['1. Data controller', [
        'The controller of your personal data is {company}, {address}, tax ID (NIP): {nip} (the “Shop”).',
        'Contact for personal data matters: e-mail {email}, phone {phone} or the contact form on this website.',
      ]],
      ['2. What data we process', [
        'When you order: name, phone number, e-mail address (optional), delivery address, delivery date, comment and order contents.',
        'When you create an account: name, e-mail address, password (we only store a secure hash of it), and phone and delivery address if you provide them.',
        'In the contact form: name, e-mail address, phone (optional) and the message.',
        'Technical data: IP address – only to protect against abuse (e.g. limiting login attempts); it is not stored in the database.',
      ]],
      ['3. Purposes and legal bases', [
        'Fulfilling and delivering your order, contacting you about it – Art. 6(1)(b) GDPR (performance of a contract).',
        'Running your customer account and order history – Art. 6(1)(b) GDPR.',
        'Replying to contact form messages – Art. 6(1)(a) GDPR (consent) and Art. 6(1)(f) (legitimate interest in handling enquiries).',
        'Issuing sales documents and accounting – Art. 6(1)(c) GDPR (legal obligation).',
        'Establishing, pursuing and defending claims, and website security – Art. 6(1)(f) GDPR.',
      ]],
      ['4. How long we keep data', [
        'Order data – for the period required by tax law (5 years from the end of the calendar year in which the tax obligation arose) and until claims become time-barred.',
        'Account data – until the account is deleted. You can delete it yourself under “My details”; your orders then remain in the system without a link to the account, for accounting purposes only.',
        'Contact form messages – up to 12 months after the matter is closed or until you withdraw consent.',
      ]],
      ['5. Recipients', [
        'Data may only be shared with parties that help us run the shop: couriers and delivery companies (to the extent needed for delivery), our hosting provider, accounting office and IT service providers, including the messenger used for new-order notifications.',
        'If any provider processes data outside the European Economic Area, this is based on the European Commission’s standard contractual clauses or another mechanism provided for in the GDPR.',
        'We do not sell your data or share it for marketing purposes.',
      ]],
      ['6. Your rights', [
        'You have the right to access, rectify and erase your data, restrict its processing, data portability, and to object to processing based on legitimate interest.',
        'You may withdraw consent at any time; this does not affect the lawfulness of processing carried out before withdrawal.',
        'You have the right to lodge a complaint with the President of the Personal Data Protection Office (UODO), ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.',
        'To exercise your rights, write to {email} or use the contact form.',
      ]],
      ['7. Cookies and browser storage', [
        'We only use strictly necessary cookies: the customer login session cookie (valid for 30 days) and the admin panel session cookie.',
        'Your cart and chosen language are saved in your browser’s local storage. This data stays on your device until you place an order.',
        'We do not use analytics or advertising cookies. Fonts are served from our own server without connecting to external services.',
      ]],
      ['8. Voluntary provision and changes', [
        'Providing data is voluntary but necessary to fulfil an order, create an account or receive a reply to your message.',
        'We do not make automated decisions or profile customers.',
        'We will announce changes to this policy on this page and update the effective date.',
      ]],
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Действует с: {date}',
    back: '← Вернуться в магазин',
    note: 'Это перевод. При расхождениях действует польская версия.',
    sections: [
      ['1. Администратор данных', [
        'Администратор ваших персональных данных — {company}, {address}, NIP: {nip} (далее — «Магазин»).',
        'Связаться по вопросам персональных данных: e-mail {email}, телефон {phone} или форма обратной связи на сайте.',
      ]],
      ['2. Какие данные мы обрабатываем', [
        'При заказе: имя, номер телефона, e-mail (по желанию), адрес и время доставки, комментарий и состав заказа.',
        'При регистрации: имя, e-mail, пароль (храним только его защищённый хеш), телефон и адрес доставки, если вы их укажете.',
        'В форме обратной связи: имя, e-mail, телефон (по желанию) и текст сообщения.',
        'Технические данные: IP-адрес — только для защиты от злоупотреблений (например, ограничения попыток входа); в базе данных он не сохраняется.',
      ]],
      ['3. Цели и правовые основания', [
        'Выполнение и доставка заказа, связь по заказу — ст. 6 п. 1 лит. b RODO/GDPR (исполнение договора).',
        'Ведение аккаунта и истории заказов — ст. 6 п. 1 лит. b RODO/GDPR.',
        'Ответ на сообщение из формы обратной связи — ст. 6 п. 1 лит. a (согласие) и лит. f (законный интерес — обработка обращений).',
        'Оформление документов продажи и бухгалтерия — ст. 6 п. 1 лит. c (обязанность по закону).',
        'Установление, предъявление и защита претензий, безопасность сайта — ст. 6 п. 1 лит. f.',
      ]],
      ['4. Сроки хранения', [
        'Данные заказов — в течение срока, требуемого налоговым законодательством (5 лет с конца календарного года, в котором возникла налоговая обязанность), и до истечения срока давности претензий.',
        'Данные аккаунта — до его удаления. Удалить аккаунт можно самостоятельно в разделе «Мои данные»; заказы при этом остаются в системе без привязки к аккаунту, только для бухгалтерии.',
        'Сообщения из формы обратной связи — до 12 месяцев после решения вопроса или до отзыва согласия.',
      ]],
      ['5. Получатели данных', [
        'Данные могут получать только те, кто помогает нам вести магазин: курьеры и службы доставки (в объёме, нужном для доставки), хостинг-провайдер, бухгалтерия и поставщики IT-услуг, включая мессенджер для уведомлений о новых заказах.',
        'Если кто-либо из поставщиков обрабатывает данные за пределами Европейской экономической зоны, это происходит на основании стандартных договорных условий Еврокомиссии или другого механизма, предусмотренного GDPR.',
        'Мы не продаём данные и не передаём их в маркетинговых целях.',
      ]],
      ['6. Ваши права', [
        'Вы имеете право на доступ к данным, их исправление, удаление, ограничение обработки, перенос, а также на возражение против обработки на основании законного интереса.',
        'Согласие можно отозвать в любой момент; это не влияет на законность обработки до отзыва.',
        'Вы можете подать жалобу Председателю Управления по защите персональных данных (UODO): ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.',
        'Чтобы воспользоваться правами, напишите на {email} или через форму обратной связи.',
      ]],
      ['7. Cookies и память браузера', [
        'Мы используем только необходимые cookies: cookie сессии входа покупателя (действует 30 дней) и cookie сессии админ-панели.',
        'В памяти браузера (localStorage) сохраняются корзина и выбранный язык. Эти данные остаются на вашем устройстве, пока вы не оформите заказ.',
        'Мы не используем аналитические и рекламные cookies. Шрифты загружаются с нашего сервера, без обращения к внешним сервисам.',
      ]],
      ['8. Добровольность и изменения', [
        'Предоставление данных добровольно, но без него нельзя выполнить заказ, создать аккаунт или получить ответ на сообщение.',
        'Мы не принимаем автоматизированных решений и не профилируем покупателей.',
        'Об изменениях политики мы сообщим на этой странице, обновив дату вступления в силу.',
      ]],
    ],
  },
  uk: {
    title: 'Політика конфіденційності',
    updated: 'Діє з: {date}',
    back: '← Повернутися до магазину',
    note: 'Це переклад. У разі розбіжностей діє польська версія.',
    sections: [
      ['1. Адміністратор даних', [
        'Адміністратором ваших персональних даних є {company}, {address}, NIP: {nip} (далі — «Магазин»).',
        'Зв’язок щодо персональних даних: e-mail {email}, телефон {phone} або форма зворотного зв’язку на сайті.',
      ]],
      ['2. Які дані ми обробляємо', [
        'Під час замовлення: ім’я, номер телефону, e-mail (за бажанням), адреса й час доставки, коментар і склад замовлення.',
        'Під час реєстрації: ім’я, e-mail, пароль (зберігаємо лише його захищений хеш), телефон і адреса доставки, якщо ви їх вкажете.',
        'У формі зворотного зв’язку: ім’я, e-mail, телефон (за бажанням) і текст повідомлення.',
        'Технічні дані: IP-адреса — лише для захисту від зловживань (наприклад, обмеження спроб входу); у базі даних вона не зберігається.',
      ]],
      ['3. Цілі та правові підстави', [
        'Виконання й доставка замовлення, зв’язок щодо замовлення — ст. 6 п. 1 літ. b RODO/GDPR (виконання договору).',
        'Ведення акаунта та історії замовлень — ст. 6 п. 1 літ. b RODO/GDPR.',
        'Відповідь на повідомлення з форми зворотного зв’язку — ст. 6 п. 1 літ. a (згода) та літ. f (законний інтерес — обробка звернень).',
        'Оформлення документів продажу та бухгалтерія — ст. 6 п. 1 літ. c (обов’язок за законом).',
        'Встановлення, пред’явлення та захист претензій, безпека сайту — ст. 6 п. 1 літ. f.',
      ]],
      ['4. Строки зберігання', [
        'Дані замовлень — протягом строку, якого вимагає податкове законодавство (5 років від кінця календарного року, в якому виник податковий обов’язок), і до спливу строку давності претензій.',
        'Дані акаунта — до його видалення. Видалити акаунт можна самостійно в розділі «Мої дані»; замовлення при цьому залишаються в системі без прив’язки до акаунта, лише для бухгалтерії.',
        'Повідомлення з форми зворотного зв’язку — до 12 місяців після вирішення питання або до відкликання згоди.',
      ]],
      ['5. Отримувачі даних', [
        'Дані можуть отримувати лише ті, хто допомагає нам вести магазин: кур’єри та служби доставки (в обсязі, потрібному для доставки), хостинг-провайдер, бухгалтерія та постачальники ІТ-послуг, зокрема месенджер для сповіщень про нові замовлення.',
        'Якщо хтось із постачальників обробляє дані за межами Європейської економічної зони, це відбувається на підставі стандартних договірних умов Єврокомісії або іншого механізму, передбаченого GDPR.',
        'Ми не продаємо дані й не передаємо їх у маркетингових цілях.',
      ]],
      ['6. Ваші права', [
        'Ви маєте право на доступ до даних, їх виправлення, видалення, обмеження обробки, перенесення, а також на заперечення проти обробки на підставі законного інтересу.',
        'Згоду можна відкликати будь-коли; це не впливає на законність обробки до відкликання.',
        'Ви можете подати скаргу Голові Управління із захисту персональних даних (UODO): ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl.',
        'Щоб скористатися правами, напишіть на {email} або через форму зворотного зв’язку.',
      ]],
      ['7. Cookies і пам’ять браузера', [
        'Ми використовуємо лише необхідні cookies: cookie сесії входу покупця (діє 30 днів) і cookie сесії адмін-панелі.',
        'У пам’яті браузера (localStorage) зберігаються кошик і вибрана мова. Ці дані залишаються на вашому пристрої, доки ви не оформите замовлення.',
        'Ми не використовуємо аналітичні та рекламні cookies. Шрифти завантажуються з нашого сервера, без звернення до зовнішніх сервісів.',
      ]],
      ['8. Добровільність і зміни', [
        'Надання даних є добровільним, але без нього неможливо виконати замовлення, створити акаунт або отримати відповідь на повідомлення.',
        'Ми не ухвалюємо автоматизованих рішень і не профілюємо покупців.',
        'Про зміни політики ми повідомимо на цій сторінці, оновивши дату набрання чинності.',
      ]],
    ],
  },
};
const POLICY_DATE = '2026-10-26';

async function renderPolicy() {
  applyI18n();
  const p = POLICY[LANG] || POLICY.pl;
  document.title = `${p.title} — Shul.Fish`;
  let s = {};
  try { s = await api('/api/settings'); } catch { /* покажем без реквизитов */ }
  const dash = '—';
  const vars = {
    company: s.company_name || s.shop_name || dash,
    address: s.company_address || s.pickup_address || dash,
    nip: s.company_nip || dash,
    email: s.contact_email || dash,
    phone: s.shop_phone || dash,
    date: new Date(POLICY_DATE + 'T00:00:00').toLocaleDateString(LOCALES[LANG]),
  };
  const fill = (text) => esc(text).replace(/\{(\w+)\}/g, (_, k) => `<b>${esc(vars[k] ?? '')}</b>`);
  $('#policyBack').textContent = p.back;
  $('#policy').innerHTML = `
    <h1>${esc(p.title)}</h1>
    <p class="muted">${fill(p.updated)}</p>
    ${p.note ? `<p class="hint-box">${esc(p.note)}</p>` : ''}
    ${p.sections.map(([h, items]) => `
      <section>
        <h2>${esc(h)}</h2>
        <ul>${items.map((i) => `<li>${fill(i)}</li>`).join('')}</ul>
      </section>`).join('')}`;
}

$('#langSwitch').innerHTML = Object.entries(LANG_LABELS)
  .map(([code, label]) => `<button type="button" data-lang="${code}">${label}</button>`).join('');
$('#langSwitch').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lang]');
  if (b) { setLang(b.dataset.lang); renderPolicy(); }
});
renderPolicy();
