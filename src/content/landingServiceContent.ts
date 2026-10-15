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
  manualWork: '/landing-service/block-6-1.png',
  dashboard: '/landing-service/block-6-2.png',
  productAnalytics: '/landing-service/block-8-1.png',
  productAb: '/landing-service/block-8-2.png',
  productManage: '/landing-service/block-8-3.png',
  team: '/landing-service/block-9-1.png',
  faq: '/landing-service/block-13-1.png',
} as const

export const serviceHero = {
  badge: 'Сервис аналитики рекламы',
  titleBefore: 'Аналитика рекламы Wildberries',
  titleHighlight: 'в одном сервисе',
  subtitle:
    'Анализируйте рекламные кампании, контролируйте расходы и заказы, сравнивайте эффективность и находите точки роста без ручного сбора данных из разных отчётов.',
  cta: 'Получить бесплатный доступ',
  perks: [
    {
      title: 'Единая аналитика рекламы',
      lines: ['Единая аналитика', 'рекламы'],
      tone: 'purple' as const,
      icon: 'chart' as const,
    },
    {
      title: 'Контроль расходов',
      lines: ['Контроль', 'расходов'],
      tone: 'green' as const,
      icon: 'shield' as const,
    },
    {
      title: 'Меньше ручной работы',
      lines: ['Меньше', 'ручной работы'],
      tone: 'purple' as const,
      icon: 'gear' as const,
    },
  ],
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
      tone: 'purple' as const,
    },
    {
      title: 'Заказы',
      description: 'Сколько заказов принесли кампании и какие товары работают лучше.',
      tone: 'green' as const,
    },
    {
      title: 'Показатели эффективности',
      description: 'ДРР, CTR, CPC и другие ключевые метрики.',
      tone: 'purple' as const,
    },
    {
      title: 'Динамика',
      description: 'Как меняются результаты со временем и где есть точки роста.',
      tone: 'green' as const,
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
  cta: 'Получить бесплатный доступ',
} as const

export const serviceWhySeparate = {
  titleBefore: 'Зачем отдельный сервис, если статистика',
  titleHighlight: 'уже есть в Wildberries?',
  /** Переносы как на макете */
  subtitleLines: [
    'Wildberries показывает данные по рекламе. Но когда кампаний много,',
    'сложнее быстро увидеть общую картину и сравнить результаты.',
    'Clicki объединяет данные и делает их удобными для анализа.',
  ],
  subtitle:
    'Wildberries показывает данные по рекламе. Но когда кампаний много, сложнее быстро увидеть общую картину и сравнить результаты. Clicki объединяет данные и делает их удобными для анализа.',
  left: {
    title: 'Стандартная статистика в Wildberries',
    items: [
      {
        title: 'Данные только по отдельным кампаниям',
        description: 'Нет общей картины по всем РК',
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
        description: 'Нет автозапуска и других возможностей',
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
  titleBefore: 'От общей картины — к конкретной',
  titleHighlight: 'кампании',
  highlightOnNewLine: true,
  subtitle: 'Показы, клики, CTR, CPC, расходы, заказы и другие показатели рекламы — в одном интерфейсе.',
  cta: 'Получить бесплатный доступ',
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
    { text: 'Состав рекламной кампании. Какие товары находятся в РК', place: 'top' as const },
    { text: 'Детализация по артикулам в комбо', place: 'bottomLeft' as const },
    { text: 'ДРР, CTR, CPC и другие ключевые показатели', place: 'bottomRight' as const },
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
    { title: 'Искать отклонения', description: 'Найти неэффективные кампании и причины' },
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
      tone: 'green' as const,
    },
    {
      title: 'Сравнивать результаты',
      description: 'Сопоставляйте периоды и отслеживайте динамику эффективности.',
      tone: 'purple' as const,
    },
    {
      title: 'Контролировать расходы',
      description: 'Следите за бюджетом и находите кампании, которые требуют внимания.',
      tone: 'green' as const,
    },
    {
      title: 'Работать с несколькими кабинетами',
      description: 'Собирайте данные по нескольким кабинетам в одном сервисе.',
      tone: 'purple' as const,
    },
    {
      title: 'Выгружать данные',
      description: 'Экспортируйте аналитику в Excel для дальнейшего анализа.',
      tone: 'green' as const,
    },
    {
      title: 'Работать вместе',
      description: 'Предоставляйте доступ сотрудникам и управляйте ролями.',
      tone: 'purple' as const,
    },
  ],
} as const

export const serviceProducts = [
  {
    id: 'analytics',
    title: 'Аналитика',
    subtitle: 'Единая аналитика по всем кампаниям и кабинетам',
    tone: 'blue' as const,
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
    tone: 'purple' as const,
    image: serviceLandingAssets.productAb,
    bullets: [
      'Тесты до 20 вариантов фото одновременно',
      'Ротация по показам или по времени',
      'Автоматическая установка лидера в карточку',
      'Удобная статистика по каждому варианту',
      'Простая настройка за несколько кликов',
    ],
    highlightBullet: 'Автоматическая установка лидера в карточку',
  },
  {
    id: 'manage',
    title: 'Управление РК',
    subtitle: 'Автозапуск, остановка и распределение бюджета по расписанию',
    tone: 'green' as const,
    image: serviceLandingAssets.productManage,
    bullets: [
      'Запуск и остановка РК по расписанию',
      'Распределение бюджета по слотам',
      'Автопополнение бюджета',
      'Управление всеми кампаниями в одном месте',
      'Экономия времени и контроль расходов',
    ],
  },
] as const

export const serviceAbout = {
  titleBefore: 'Clicki создан',
  titleHighlight: 'не теоретиками',
  paragraphs: [
    'Clicki появился как внутренний инструмент маркетингового агентства.',
    'Мы сами работаем с рекламой Wildberries и сталкиваемся с теми же задачами: много кампаний, данные из разных источников, контроль расходов и необходимость быстро понимать, что происходит.',
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
  subtitle: 'Один тариф — полный доступ ко всем возможностям сервиса.',
  periodHintTwoWeeks: 'Чтобы попробовать сервис',
  periodHintMonth: 'Выгоднее для постоянной работы',
  includedLabel: 'Во все тарифы включены все возможности:',
  included: [
    'Полная аналитика рекламных показателей',
    'A/B тестирование фотографий',
    'Автозапуск РК по расписанию',
  ],
  onlyCabinetsNote: 'Разница только в количестве кабинетов',
  plans: [
    {
      id: 'start',
      name: 'Старт',
      cabinets: '1 кабинет',
      priceTwoWeeks: 390,
      priceMonth: 690,
      popular: false,
      cta: 'Выбрать',
      to: '/register?plan=start',
    },
    {
      id: 'optimum',
      name: 'Оптимум',
      cabinets: 'До 5 кабинетов',
      priceTwoWeeks: 1490,
      priceMonth: 2690,
      popular: true,
      cta: 'Выбрать',
      to: '/register?plan=optimum',
    },
    {
      id: 'profi',
      name: 'Профи',
      cabinets: 'До 10 кабинетов',
      priceTwoWeeks: 2790,
      priceMonth: 4990,
      popular: false,
      cta: 'Выбрать',
      to: '/register?plan=profi',
    },
    {
      id: 'custom',
      name: 'Свыше',
      cabinets: 'Более 10 кабинетов',
      priceTwoWeeks: null,
      priceMonth: null,
      popular: false,
      cta: 'Оставить заявку',
      consultation: true,
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
      description: 'Полное управление рекламой на Wildberries: от стратегии до масштабирования.',
      tone: 'purple' as const,
      bullets: [
        'Анализ ниши и конкурентов',
        'Настройка и запуск кампаний',
        'Постоянная оптимизация',
        'Масштабирование результатов',
        'Прозрачная отчётность',
      ],
      cta: 'Узнать подробнее',
      formKind: 'agency' as const,
    },
    {
      id: 'audit',
      title: 'Аудит рекламного кабинета',
      description: 'Разберём ваш кабинет и покажем, где теряются деньги и конкретные точки роста.',
      note: 'покажем, где теряются деньги',
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
      q: 'Что делать после регистрации?',
      a: 'После регистрации нужно подключить рекламный кабинет Wildberries и перейти в аналитику. Мы подготовили простую инструкцию, которая поможет сделать это быстро.',
    },
  ],
} as const

export const serviceBlog = {
  titleBefore: 'Полезные',
  titleHighlight: 'материалы',
  subtitle: 'Практические советы, разборы и обновления сервиса для эффективной рекламы на Wildberries.',
  allLabel: 'Все статьи',
  items: [
    {
      tag: 'Практика',
      tagTone: 'purple' as const,
      date: '2 октября 2024',
      title: 'Как найти ключи, которые сливают бюджет на Wildberries',
      description: 'Показываем пошаговый алгоритм анализа и примеры из реальных кабинетов.',
    },
    {
      tag: 'Аналитика',
      tagTone: 'lavender' as const,
      date: '28 сентября 2024',
      title: 'Почему ДРР может расти, даже если заказов больше',
      description: 'Разбираем основные причины и даём рекомендации, как вернуть ДРР в норму.',
    },
    {
      tag: 'Кейсы',
      tagTone: 'green' as const,
      date: '20 сентября 2024',
      title: 'Кейс: рост заказов на 156% за 2 месяца с помощью Clicki',
      description: 'Как мы оптимизировали рекламные кампании и какие инструменты использовали.',
    },
    {
      tag: 'Обновления',
      tagTone: 'blue' as const,
      date: '15 сентября 2024',
      title: 'Новый инструмент: A/B-тест фотографий в Clicki',
      description: 'Тестируйте до 20 вариантов, выбирайте лучшие и увеличивайте конверсию карточки.',
    },
  ],
} as const

export const serviceFinalCta = {
  titleBefore: 'Начните анализировать рекламу',
  titleHighlight: 'Wildberries бесплатно',
  subtitle:
    'Получите доступ к аналитике рекламных кампаний, расходам, заказам и ключевым показателям в одном сервисе.',
  cta: 'Получить бесплатный доступ',
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
  telegram: '@kaypavel',
  telegramUrl: 'https://t.me/kaypavel',
  legalLinks: [
    { label: 'Политика конфиденциальности', to: '/privacy' },
    { label: 'Пользовательское соглашение', to: '/user-agreement' },
  ],
} as const
