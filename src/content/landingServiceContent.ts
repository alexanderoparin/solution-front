/** Контент нового сервисного лендинга (макет «Лендинг Сервис»). */

export const SERVICE_LANDING_ANCHORS = {
  features: 'features',
  pricing: 'pricing',
  faq: 'faq',
  blog: 'blog',
  about: 'about',
  contacts: 'contacts',
} as const

export const serviceLandingNav = [
  { label: 'Возможности', href: `#${SERVICE_LANDING_ANCHORS.features}` },
  { label: 'Тарифы', href: `#${SERVICE_LANDING_ANCHORS.pricing}` },
  { label: 'FAQ', href: `#${SERVICE_LANDING_ANCHORS.faq}` },
  { label: 'Блог', href: `#${SERVICE_LANDING_ANCHORS.blog}` },
] as const

export const serviceLandingAssets = {
  hero: '/landing-service/block-1-1.png?v=2',
  /** Порядок как на макете: карточка → воронка/таблица → сравнение периодов */
  analyticsStack1: '/landing-service/block-3-3.png?v=3',
  analyticsStack2: '/landing-service/block-3-1.png?v=3',
  analyticsStack3: '/landing-service/block-3-2.png?v=3',
  campaignDetail: '/landing-service/block-5-1.png',
  manualWork: '/landing-service/block-6-1.png?v=3',
  dashboard: '/landing-service/block-6-2.png?v=11',
  /** Иконки блока «Что можно делать» — 3D clay как у audience */
  capIcons: [
    '/landing-service/caps/cap-1.png?v=2',
    '/landing-service/caps/cap-2.png?v=2',
    '/landing-service/caps/cap-3.png?v=2',
    '/landing-service/caps/cap-4.png?v=2',
    '/landing-service/caps/cap-5.png?v=2',
    '/landing-service/caps/cap-6.png?v=2',
  ] as const,
  /** Иконки блока проблемы — вырезаны из макета 2.png */
  problemIcons: [
    '/landing-service/problem/problem-1-wallet.png?v=6',
    '/landing-service/problem/problem-2-cart.png?v=6',
    '/landing-service/problem/problem-3-bars.png?v=6',
    '/landing-service/problem/problem-4-rise.png?v=6',
  ] as const,
  /** Порядок скринов как на макете 8.png: аналитика / А/В / управление РК */
  productAnalytics: '/landing-service/block-8-3.png?v=2',
  productAb: '/landing-service/block-8-1.png?v=4',
  productManage: '/landing-service/block-8-2.png?v=2',
  /** Иконки карточек продуктов — 3D clay */
  productIcons: [
    '/landing-service/products/prod-icon-1.png?v=2',
    '/landing-service/products/prod-icon-2.png?v=2',
    '/landing-service/products/prod-icon-3.png?v=2',
  ] as const,
  /** 3D-иконки блока аудитории — вырезаны из audience-block-ref */
  audienceArts: [
    '/landing-service/audience/aud-icon-1.png?v=5',
    '/landing-service/audience/aud-icon-2.png?v=4',
    '/landing-service/audience/aud-icon-3.png?v=4',
    '/landing-service/audience/aud-icon-4.png?v=4',
  ] as const,
  team: '/landing-service/block-9-1.png?v=4',
  faq: '/landing-service/block-13-1.png',
  /** Аватар плавающего виджета Telegram-бота */
  botAvatar: '/landing-service/clicki-bot-avatar.jpg',
} as const

/** Плавающий виджет проверки рекламы WB через Telegram-бота. */
export const serviceBotWidget = {
  tipBefore: 'Проверь ',
  tipAccent: 'рекламу',
  tipAfter: 'на WB за несколько минут',
  /** Шапка модалки — лавандовый пузырь рядом с аватаром. */
  modalBadgeLines: [
    'Полезный инструмент',
    'для вашей рекламы',
    'на Wildberries',
  ] as const,
  titleBefore: 'Сколько денег ',
  titleAccent: 'съедает',
  titleAfter: ' реклама?',
  description:
    'Найдите кластеры, которые расходуют бюджет без результата, и поймите, где стоит оптимизировать рекламу.',
  legend: [
    {
      color: '#EF4444',
      soft: '#FEE2E2',
      line1: 'Кластеры, которые',
      line2: 'сливают деньги',
    },
    {
      color: '#F59E0B',
      soft: '#FEF3C7',
      line1: 'Кластеры, которые',
      line2: 'стоит докрутить',
    },
    {
      color: '#22C55E',
      soft: '#DCFCE7',
      line1: 'Кластеры, которые',
      line2: 'работают как надо',
    },
  ] as const,
  note: 'Бот покажет, сколько вы потратили на ключи без заказов.',
  cta: 'Попробовать бота →',
  botUrl: 'https://t.me/ClickiWBot',
  /** Задержка появления подсказки, мс (5–7 с). */
  tipDelayMs: 6000,
} as const

export const serviceHero = {
  badge: 'Раздел «Аналитика» бесплатно',
  /** Строки заголовка как на макете: тёмный / смешанный / акцентный. */
  titleLine1: 'Аналитика рекламы',
  titleLine2Before: 'Wildberries',
  titleLine2Highlight: 'в одном',
  titleLine3: 'сервисе',
  subtitle:
    'Анализируйте рекламные кампании, контролируйте расходы и заказы, сравнивайте эффективность и находите точки роста без ручного сбора данных из разных отчётов.',
  cta: 'Начать тестовый период',
  trialNoteLines: ['Раздел «Аналитика» бесплатно.', 'Все возможности сервиса на 7 дней без ограничений.'] as const,
} as const

export const serviceProblem = {
  titleLines: [
    { text: 'Реклама на Wildberries уже', tone: 'dark' as const },
    { text: 'работает. Но знаете ли вы,', tone: 'dark' as const },
    { text: 'какие кампании действительно', tone: 'accent' as const },
    { text: 'эффективны?', tone: 'accent' as const },
  ],
  paragraphs: [
    'В кабинете Wildberries много данных по рекламе. Но когда кампаний становится больше, сложнее быстро увидеть общую картину: расходы, заказы, изменения показателей и кампании, требующие внимания.',
    'Clicki собирает данные по рекламным кампаниям в одном месте, чтобы быстрее анализировать рекламу и принимать решения на основе цифр.',
  ],
  items: [
    {
      title: 'Расходы на рекламу',
      description: 'Сколько потрачено, на какие кампании и ключевые запросы.',
      icon: serviceLandingAssets.problemIcons[0],
    },
    {
      title: 'Заказы',
      description: 'Сколько заказов принесли кампании и какие товары работают лучше.',
      icon: serviceLandingAssets.problemIcons[1],
    },
    {
      title: 'Показатели эффективности',
      description: 'ДРР, CTR, CPC и другие ключевые метрики.',
      icon: serviceLandingAssets.problemIcons[2],
    },
    {
      title: 'Динамика',
      description: 'Как меняются результаты со временем и где есть точки роста.',
      icon: serviceLandingAssets.problemIcons[3],
    },
  ],
} as const

export const serviceAnalyticsOverview = {
  /** Перенос после «аналитика», как на макете */
  titleBefore: 'Вся аналитика',
  titleAfter: 'рекламы Wildberries',
  titleHighlight: 'перед глазами',
  /** Подсветка заголовка с новой строки — как на макете */
  highlightOnNewLine: true,
  subtitle:
    'Не собирайте показатели вручную. Clicki объединяет данные в одном интерфейсе, чтобы быстро посмотреть статистику, сравнить периоды и оценить эффективность рекламы.',
  badges: [
    { label: 'Расходы', lines: ['Расходы'], tone: 'purple' as const, icon: 'chart' as const },
    { label: 'Заказы', lines: ['Заказы'], tone: 'green' as const, icon: 'cart' as const },
    {
      label: 'Эффективность (CTR, CPC, CPO, ДРР и др.)',
      lines: ['Эффективность', '(CTR, CPC, CPO, ДРР и др.)'],
      tone: 'purple' as const,
      icon: 'trend' as const,
    },
  ],
  cta: 'Начать тестовый период',
  trialNoteLines: ['Раздел «Аналитика» бесплатно.', 'Все возможности сервиса на 7 дней без ограничений.'] as const,
} as const

export const serviceWhySeparate = {
  titleBefore: 'Зачем отдельный сервис, если',
  titleAfter: 'статистика',
  titleHighlight: 'уже есть в Wildberries?',
  /** Вторая строка: «статистика» + акцент */
  afterOnNewLine: true,
  /** Переносы подзаголовка как на макете */
  subtitleLines: [
    'Wildberries показывает данные по рекламе.',
    'Но когда кампаний много, увидеть общую картину и сравнить результаты становится сложнее.',
    'Clicki объединяет данные и делает их удобными для анализа.',
  ],
  subtitle:
    'Wildberries показывает данные по рекламе. Но когда кампаний много, увидеть общую картину и сравнить результаты становится сложнее. Clicki объединяет данные и делает их удобными для анализа.',
  left: {
    title: 'Стандартная статистика в Wildberries',
    items: [
      {
        title: 'Данные только по отдельным кампаниям',
        description: 'Нет возможности увидеть рекламную и общую воронку вместе',
      },
      {
        title: 'Только базовые показатели',
        description: 'Сложно увидеть зоны роста',
      },
      {
        title: 'Каждую кампанию нужно анализировать вручную',
        description: 'Много времени на сбор и сравнение',
      },
      {
        title: 'Нет удобных инструментов для автоматизации',
        description: 'Нет возможности настройки нескольких периодов запуска',
      },
    ],
  },
  right: {
    title: 'Clicki',
    subtitle: 'Единая аналитика и инструменты для роста',
    items: [
      {
        title: 'Все кампании в одном кабинете',
        description: 'Единая аналитика по всем РК и кабинетам',
      },
      {
        title: 'Расширенная аналитика',
        description: 'Показатели, зоны роста конверсии, сравнение периодов',
      },
      {
        title: 'Автоматический сбор и анализ',
        description: 'Экономия времени и наглядные отчёты',
      },
      {
        title: 'Инструменты для увеличения результатов',
        description: 'Автозапуск РК, A/B-тесты фотографий и удобное управление рекламой',
      },
    ],
  },
} as const

export const serviceCampaignDepth = {
  titleBefore: 'От общей картины —',
  titleAfter: 'к конкретной',
  titleHighlight: 'кампании',
  afterOnNewLine: true,
  highlightOnNewLine: false,
  cta: 'Начать тестовый период',
  trialNoteLines: ['Раздел «Аналитика» бесплатно.', 'Все возможности сервиса на 7 дней без ограничений.'] as const,
  metrics: [
    { label: 'Показы', icon: 'eye' as const, tone: 'purple' as const },
    { label: 'Клики', icon: 'click' as const, tone: 'green' as const },
    { label: 'CTR', icon: 'percent' as const, tone: 'purple' as const },
    { label: 'CPC', icon: 'ruble' as const, tone: 'green' as const },
    { label: 'Расходы', icon: 'wallet' as const, tone: 'purple' as const },
    { label: 'Заказы', icon: 'cart' as const, tone: 'green' as const },
    { label: 'ДРР', icon: 'bars' as const, tone: 'purple' as const },
    { label: 'Другие показатели', icon: 'pie' as const, tone: 'green' as const },
  ],
  callouts: [
    {
      text: 'Состав рекламной кампании. Какие товары находятся в РК',
      place: 'topRight' as const,
      tone: 'green' as const,
    },
    {
      text: 'Детализация по артикулам в комбо',
      place: 'bottom' as const,
      tone: 'green' as const,
    },
    {
      text: 'ДРР, CTR, CPC и другие ключевые показатели',
      place: 'bottomRight' as const,
      tone: 'purple' as const,
    },
  ],
} as const

export const serviceLessManual = {
  titleBefore: 'Меньше ручной работы.',
  titleHighlight: 'Больше контроля над рекламой.',
  subtitle:
    'Clicki помогает убрать часть рутинной работы с рекламными данными и быстрее переходить от цифр к решениям.',
  insteadTitle: 'Вместо этого',
  insteadSubtitle: 'Ручной сбор и анализ данных',
  steps: [
    { title: 'Собрать данные', description: 'Экспорт из кабинета Wildberries' },
    { title: 'Свести таблицы', description: 'Объединить данные, убрать лишнее' },
    { title: 'Сравнить периоды', description: 'Посчитать показатели' },
    { title: 'Искать отклонения', description: 'Найти неэффективные кампании\nи причины' },
  ],
} as const

/** Блок «для кого» — между «Меньше ручной работы» и «Что можно делать». */
export const serviceAudience = {
  titleBrand: 'Clicki —',
  titleLine1: 'результаты, которые видно.',
  titleLine2: 'Работа, которую можно доказать.',
  subtitleLine1: 'Сервис помогает тем, кто работает с рекламой на Wildberries —',
  subtitleLine2: 'от одного кабинета до крупной команды.',
  calloutLines: [
    'Всё, что нужно',
    'для контроля, аналитики',
    'и роста — в одном',
    'сервисе',
  ] as const,
  items: [
    {
      tone: 'purple' as const,
      titleLine1: 'Менеджеры',
      titleLine2: 'Wildberries',
      subtitleLine1: 'Докажите клиенту',
      subtitleLine2: 'свою ценность',
      problem:
        'Клиент не видит результат вашей работы — и начинает задумываться о смене менеджера?',
      bullets: [
        'Наглядно показывайте результаты рекламных кампаний.',
        'Демонстрируйте изменения ключевых показателей в динамике.',
        'Подкрепляйте свои решения цифрами, а не словами.',
      ],
      result: 'Клиент видит вашу работу и понимает, за что платит.',
      art: serviceLandingAssets.audienceArts[0],
    },
    {
      tone: 'green' as const,
      titleLine1: 'Селлеры на',
      titleLine2: 'Wildberries',
      subtitleLine1: 'Держите бизнес',
      subtitleLine2: 'под контролем',
      problem: 'Что изменилось в рекламе сегодня и насколько эффективно работает ваш менеджер?',
      bullets: [
        'Отслеживайте ежедневную динамику рекламных показателей.',
        'Сравнивайте результаты и замечайте отклонения.',
        'Контролируйте работу менеджера на основе фактических данных.',
      ],
      result: 'Вы видите, что происходит с рекламой, а не просто ждёте отчёта.',
      art: serviceLandingAssets.audienceArts[1],
    },
    {
      tone: 'blue' as const,
      titleLine1: 'Агентства',
      titleLine2: 'и команды',
      subtitleLine1: 'Контролируйте команду',
      subtitleLine2: 'и повышайте продления',
      problem: 'Как контролировать работу менеджеров и доказывать ценность услуг каждому клиенту?',
      bullets: [
        'Подключите менеджеров к единой системе.',
        'Контролируйте результаты по всем клиентским кабинетам.',
        'Показывайте клиентам прозрачную отчётность по проделанной работе.',
      ],
      result: 'Больше прозрачности для клиентов — больше оснований продлевать сотрудничество.',
      art: serviceLandingAssets.audienceArts[2],
    },
    {
      tone: 'violet' as const,
      titleLine1: 'Школы',
      titleLine2: 'и наставники',
      subtitleLine1: 'Учите работать с данными,',
      subtitleLine2: 'а не наугад',
      problem:
        'Как научить менеджеров и селлеров принимать решения и проверять гипотезы на цифрах?',
      bullets: [
        'Объедините работу менеджера и селлера в единой среде.',
        'Оцифровывайте гипотезы и отслеживайте их результаты.',
        'Показывайте влияние изменений на конкретных показателях.',
      ],
      result: 'От гипотез — к проверяемым решениям и измеримым результатам.',
      art: serviceLandingAssets.audienceArts[3],
    },
  ],
} as const

export const serviceCapabilities = {
  titleBefore: 'Что можно делать в',
  titleHighlight: 'Clicki',
  subtitle:
    'Все инструменты для работы с рекламой Wildberries в одном сервисе. Анализируйте, контролируйте и управляйте рекламными кампаниями без ручного сбора данных.',
  items: [
    {
      title: 'Анализировать рекламные кампании',
      description: 'Поиск, ключи, CTR, CPC, расходы, заказы и другие показатели.',
      icon: serviceLandingAssets.capIcons[0],
    },
    {
      title: 'Сравнивать результаты',
      description: 'Сопоставляйте периоды и отслеживайте динамику эффективности.',
      icon: serviceLandingAssets.capIcons[1],
    },
    {
      title: 'Контролировать расходы',
      description: 'Следите за бюджетом и находите кампании, которые требуют внимания.',
      icon: serviceLandingAssets.capIcons[2],
    },
    {
      title: 'Работать с несколькими кабинетами',
      description: 'Собирайте данные по нескольким кабинетам в одном сервисе.',
      icon: serviceLandingAssets.capIcons[3],
    },
    {
      title: 'Выгружать данные',
      description: 'Экспортируйте данные в Excel для дальнейшей работы в своих системах.',
      icon: serviceLandingAssets.capIcons[4],
    },
    {
      title: 'Работать вместе',
      description: 'Предоставляйте доступ сотрудникам и управляйте ролями.',
      icon: serviceLandingAssets.capIcons[5],
    },
  ],
} as const

export const serviceProducts = [
  {
    id: 'analytics',
    title: 'Аналитика',
    subtitle: 'Единая аналитика по всем кампаниям и кабинетам',
    badge: { label: 'Бесплатно', tone: 'green' as const },
    tone: 'blue' as const,
    icon: serviceLandingAssets.productIcons[0],
    image: serviceLandingAssets.productAnalytics,
    bullets: [
      'Аналитика по всем кампаниям и кабинетам',
      'Ключевые показатели и зоны роста',
      'Сравнение периодов',
      'Удобные графики и отчёты',
      'Выгрузка данных в Excel',
    ],
  },
  {
    id: 'ab',
    title: 'А/В-тесты',
    subtitle: 'Тестируйте до 20 вариантов фото и выбирайте самые эффективные',
    badge: { label: 'Платная опция', tone: 'purple' as const },
    tone: 'purple' as const,
    icon: serviceLandingAssets.productIcons[1],
    image: serviceLandingAssets.productAb,
    bullets: [
      'Тесты до 20 вариантов фото одновременно',
      'Ротация по показам или по времени',
      'Автоматическая установка лидера',
      'Статистика по каждому варианту',
      'Простая настройка за несколько кликов',
    ],
  },
  {
    id: 'manage',
    title: 'Управление РК',
    subtitle: 'Автозапуск, остановка и распределение бюджета по расписанию',
    badge: { label: 'Платная опция', tone: 'purple' as const },
    tone: 'green' as const,
    icon: serviceLandingAssets.productIcons[2],
    image: serviceLandingAssets.productManage,
    bullets: [
      'Запуск и остановка РК по расписанию',
      'Распределение бюджета по слотам',
      'Автопополнение бюджета',
      'Управление всеми кампаниями в одном месте',
      'Экономия расходов',
    ],
  },
] as const

/** Баннер пробного периода — между продуктами и блоком «О нас». */
export const serviceTrialBanner = {
  titleBefore: 'Попробуйте сервис',
  titleHighlight: 'бесплатно',
  lines: [
    '7 дней доступа ко всем возможностям без ограничений.',
    'Оцените, как просто управлять рекламой на Wildberries.',
  ] as const,
  cta: 'Начать тестовый период',
} as const

/** Баннер под тарифами. */
export const servicePricingTrialBanner = {
  titleBefore: 'Начните тестовый период',
  titleHighlight: 'и оцените все возможности',
  lines: [
    '7 дней доступа ко всем функциям без ограничений.',
    'Никакой привязки карты — просто зарегистрируйтесь и начните работать.',
  ] as const,
  cta: 'Начать тестовый период',
} as const

export const serviceAbout = {
  titleBefore: 'Clicki создан',
  titleHighlight: 'не теоретиками',
  paragraphs: [
    'Clicki появился как внутренний инструмент маркетингового агентства.',
    'Уже более 3-х лет, ежедневно, сами работаем с рекламой Wildberries и сталкиваемся с теми же задачами: много кампаний, данные из разных источников, контроль расходов и необходимость быстро понимать, что происходит.',
  ],
  /** Плавающие карточки вокруг фото команды — как на макете 9.png */
  floats: [
    {
      id: 'campaigns',
      title: 'Рекламные кампании',
      kind: 'bars' as const,
      place: 'topLeft' as const,
    },
    {
      id: 'orders',
      title: 'Заказы',
      value: '1 892',
      delta: '+28%',
      kind: 'lineGreen' as const,
      place: 'midRight' as const,
    },
    {
      id: 'spend',
      title: 'Расходы',
      value: '124 530 ₽',
      delta: '-12%',
      kind: 'linePurple' as const,
      place: 'bottomLeft' as const,
    },
  ],
} as const

export const serviceOnboarding = {
  titleBefore: 'Что будет',
  titleHighlight: 'после регистрации',
  subtitle: 'Несколько простых шагов, чтобы получить доступ к аналитике и начать работать с рекламными данными.',
  steps: [
    {
      n: '01',
      title: 'Создаёте аккаунт',
      description: 'Регистрация занимает несколько минут. Достаточно указать email и пароль.',
      tone: 'purple' as const,
    },
    {
      n: '02',
      title: 'Подключаете кабинет Wildberries',
      description: 'Безопасное подключение через официальный API Wildberries. Ваши данные надёжно защищены.',
      tone: 'green' as const,
    },
    {
      n: '03',
      title: 'Получаете доступ к аналитике',
      description: 'Данные загружаются автоматически, и вы сразу видите основные показатели в удобном интерфейсе.',
      tone: 'purple' as const,
    },
    {
      n: '04',
      title: 'Начинаете анализировать рекламу',
      description:
        'Сравнивайте периоды, находите эффективные кампании, управляйте рекламой и принимайте решения на основе данных.',
      tone: 'green' as const,
    },
  ],
} as const

export const servicePricing = {
  titleBefore: 'Простые и прозрачные',
  titleHighlight: 'тарифы',
  subtitle:
    'Выбирайте только нужные функции или получите полный доступ ко всем возможностям сервиса',
  plans: [
    {
      id: 'analytics' as const,
      name: 'Аналитика',
      descriptionLines: ['Единая аналитика', 'по всем кампаниям', 'и кабинетам.'] as const,
      badge: { label: 'Бесплатно', tone: 'green' as const },
      tone: 'blue' as const,
      icon: serviceLandingAssets.productIcons[0],
      /** Фиксировано: раздел бесплатный. */
      priceMode: 'fixed' as const,
      priceFixed: '0 ₽',
      checkTone: 'purple' as const,
      bullets: [
        'Аналитика по всем кампаниям и кабинетам',
        'Ключевые показатели и зоны роста',
        'Сравнение периодов',
        'Удобные графики и отчёты',
        'Выгрузка данных в Excel',
      ],
    },
    {
      id: 'manage' as const,
      name: 'Управление РК',
      descriptionLines: [
        'Автозапуск, остановка и распределение',
        'бюджета по расписанию.',
      ] as const,
      tone: 'green' as const,
      icon: serviceLandingAssets.productIcons[2],
      /** Минимальный CAMPAIGN-пакет за 14 дней. */
      priceMode: 'campaignManageFrom' as const,
      pricePrefix: 'от',
      period: '/ 2 недели',
      checkTone: 'green' as const,
      bullets: [
        'Запуск и остановка РК по расписанию',
        'Распределение бюджета по слотам',
        'Автопополнение бюджета',
        'Управление всеми кампаниями в одном месте',
        'Экономия расходов',
      ],
    },
    {
      id: 'ab' as const,
      name: 'А/В-тесты',
      descriptionLines: [
        'Тестируйте до 20 вариантов',
        'фото и выбирайте',
        'самые эффективные.',
      ] as const,
      tone: 'purple' as const,
      icon: serviceLandingAssets.productIcons[1],
      /** Цена AB_PACK на 1 тест. */
      priceMode: 'abTestFrom' as const,
      pricePrefix: 'от',
      period: '/ 1 тест',
      checkTone: 'purple' as const,
      bullets: [
        'Тесты до 20 вариантов фото одновременно',
        'Ротация по показам или по времени',
        'Автоматическая установка лидера',
        'Статистика по каждому варианту',
        'Простая настройка за несколько кликов',
      ],
    },
    {
      id: 'full' as const,
      name: 'Полный доступ',
      descriptionLines: ['Все возможности', 'сервиса Clicki', 'в одном тарифе.'] as const,
      tone: 'amber' as const,
      icon: '/landing-service/products/prod-icon-4.png?v=1',
      /** Минимальный MAIN-пакет за 14 дней. */
      priceMode: 'fullAccessFrom' as const,
      pricePrefix: 'от',
      period: '/ 2 недели',
      checkTone: 'amber' as const,
      bullets: [
        'Полная аналитика рекламных показателей',
        'Управление РК по расписанию',
        'А/В тестирование фотографий',
        'Все дополнительные возможности',
        'Выгоднее, чем покупать отдельно',
      ],
    },
  ],
} as const

export const serviceAgencyHelp = {
  titleBefore: 'Нужна не только аналитика,',
  titleHighlight: 'но и помощь с рекламой?',
  subtitle: 'Clicki можно использовать самостоятельно или передать управление рекламой специалистам.',
  cards: [
    {
      id: 'manage',
      title: 'Ведение рекламного кабинета',
      /** Правка на макете: убрано «Работают опытные специалисты.» */
      description: 'Полное управление рекламой на Wildberries: от стратегии до масштабирования.',
      tone: 'purple' as const,
      bullets: [
        'Определение целей РК и их достижение',
        'Полный анализ артикулов от воронок до конкурентов',
        'Полный контроль РК',
        'Еженедельные видео-встречи с разбором ситуации и планами',
        'Использование своих оттестированых гипотез',
      ],
      cta: 'Узнать подробнее',
      formKind: 'agency' as const,
    },
    {
      id: 'audit',
      title: 'Аудит рекламного кабинета',
      description: 'Разберем ваш кабинет, покажем где теряются деньги и что можно улучшить.',
      tone: 'green' as const,
      bullets: [
        'Анализ текущих кампаний',
        'Выявление неэффективных расходов',
        'Поиск точек роста',
        'Рекомендации по оптимизации',
        'Понятный отчёт с выводами',
      ],
      cta: 'Узнать подробнее',
      formKind: 'audit' as const,
    },
  ],
} as const

export const serviceFaq = {
  titleBefore: 'Частые',
  titleHighlight: 'вопросы',
  subtitle:
    'Здесь собрали ответы на самые популярные вопросы. Если не нашли нужную информацию — напишите нам, мы всегда на связи.',
  items: [
    {
      q: 'Что умеет и показывает Clicki?',
      a: 'Clicki собирает и объединяет данные по всем вашим рекламным кампаниям на Wildberries. Показывает показы, клики, CTR, CPC, ДРР, расходы, заказы и другие ключевые показатели. Позволяет увидеть общую картину, найти неэффективные кампании, сравнить периоды и быстрее принимать решения.',
    },
    {
      q: 'Можно ли подключить несколько рекламных кабинетов?',
      a: 'Да. Clicki поддерживает работу с несколькими рекламными кабинетами Wildberries.',
    },
    {
      q: 'Могу ли я сравнивать больше 2 периодов статистики?',
      a: 'Да, можно выбрать до 5 периодов одновременно.',
    },
    {
      q: 'Можно ли выгружать данные?',
      a: 'Да, все данные можно выгрузить в Excel для дальнейшего анализа.',
    },
    {
      q: 'Какие тарифы есть в Clicki и что входит в бесплатный доступ?',
      a: 'Раздел «Аналитика» доступен бесплатно. Управление рекламными кампаниями и A/B-тесты можно подключить отдельно. Также есть единый тариф, включающий все платные функции. Новым пользователям предоставляется 7 дней доступа ко всем возможностям без ограничений.',
    },
    {
      q: 'Что делать после регистрации?',
      a: 'После регистрации нужно подключить рекламный кабинет Wildberries и перейти в аналитику. Мы подготовили простую инструкцию, которая поможет сделать это быстро.',
    },
  ],
} as const

export const serviceBlog = {
  titleBefore: 'Полезные',
  titleHighlight: 'материалы',
  subtitle: 'Практические советы, разборы и обновления сервиса для эффективной рекламы на Wildberries.',
  /** Пока статей нет — показываем заглушку; когда появятся — заполним items. */
  comingSoonTitle: 'Раздел в разработке',
  comingSoonDescription: 'Скоро здесь появятся статьи, разборы и обновления сервиса.',
  items: [] as ReadonlyArray<{
    tag: string
    tagTone: 'purple' | 'lavender' | 'green' | 'blue'
    date: string
    title: string
    description: string
  }>,
} as const

export const serviceFinalCta = {
  titleBefore: 'Начните анализировать рекламу',
  titleHighlight: 'Wildberries бесплатно',
  subtitle:
    'Получите доступ к аналитике рекламных кампаний, расходам, заказам и ключевым показателям в одном сервисе.',
  cta: 'Начать тестовый период',
  trialNoteLines: ['Раздел «Аналитика» бесплатно.', 'Все возможности сервиса на 7 дней без ограничений.'] as const,
} as const

export const serviceFooter = {
  tagline: 'Аналитика и управление рекламой на Wildberries',
  productLinks: [
    { label: 'Возможности', href: `#${SERVICE_LANDING_ANCHORS.features}` },
    { label: 'Тарифы', href: `#${SERVICE_LANDING_ANCHORS.pricing}` },
    { label: 'Блог', href: `#${SERVICE_LANDING_ANCHORS.blog}` },
  ],
  companyLinks: [
    { label: 'О сервисе', href: `#${SERVICE_LANDING_ANCHORS.about}` },
    { label: 'Реквизиты', to: '/requisites' },
  ],
  telegram: '@clickiads',
  telegramUrl: 'https://t.me/clickiads',
  /** Соцкнопки как на макете 16.png (вместо YouTube — Max). */
  socialLinks: [
    { label: 'Telegram', href: 'https://t.me/clickiads', icon: 'telegram' as const },
    { label: 'Email', href: 'mailto:corp@click-i.ru', icon: 'chat' as const },
    { label: 'VK', href: 'https://vk.ru/clickiads', icon: 'vk' as const },
    { label: 'Max', href: 'https://max.ru/join/5UDb_r7SCYCHBqzvql7aU76m-kW0INceFCYV2DylCsc', icon: 'max' as const },
  ],
  legalLinks: [
    { label: 'Политика конфиденциальности', to: '/privacy' },
    { label: 'Пользовательское соглашение', to: '/user-agreement' },
    { label: 'Обработка персональных данных', to: '/privacy' },
  ],
} as const
