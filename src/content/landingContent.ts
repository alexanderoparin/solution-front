import { landingAssets } from '../styles/landing'

export const LANDING_ANCHORS = {
  about: 'about',
  services: 'services',
  cases: 'cases',
  pricing: 'pricing',
  blog: 'blog',
  contacts: 'contacts',
  features: 'features',
  faq: 'faq',
} as const

export const landingNavItems = [
  { label: 'О нас', href: `#${LANDING_ANCHORS.about}` },
  { label: 'Сервисы', href: `#${LANDING_ANCHORS.services}` },
  { label: 'Тарифы', href: `#${LANDING_ANCHORS.pricing}` },
  { label: 'Блог', href: `#${LANDING_ANCHORS.blog}` },
  { label: 'Контакты', href: `#${LANDING_ANCHORS.contacts}` },
] as const

export const landingHero = {
  titleBefore: 'Увеличиваем продажи',
  titleHighlight: 'Wildberries',
  titleAfter: ' с помощью рекламы и аналитики',
  /** Предлог перед подсветкой — с новой строки, без «висящего» «на» в конце первой. */
  titlePreposition: 'на',
  subtitle:
    'Clicki — маркетинговое агентство и сервис для эффективного продвижения на Wildberries: аналитика, автоматизация рекламы\nи ведение рекламных кабинетов под ключ.',
  trustBadges: [
    { title: '3+ года', description: 'практического опыта' },
    { title: '60%', description: 'клиентов по рекомендации' },
    { title: '84%', description: 'продолжают сотрудничество' },
  ],
} as const

export const landingMission = {
  quote:
    'Clicki появился не как стартап, а как внутренний инструмент нашего агентства. Мы хорошо понимаем, где продавцы теряют деньги, какие задачи приходится выполнять вручную и какие инструменты действительно помогают увеличивать прибыль. Поэтому мы собрали в одном сервисе инструменты, которыми пользуемся сами каждый день. Без лишних функций, только то, что действительно помогает продавцам увеличивать прибыль и экономить время.',
  author: 'Команда Clicki',
} as const

export const landingServices = [
  {
    id: 'analytics',
    badge: 'Бесплатно',
    title: 'Аналитика рекламы',
    description: 'Собираем и объединяем все данные по рекламе\nв одном месте',
    bullets: ['Детальная статистика по кампаниям', 'Сравнительный анализ выбранных периодов', 'Экспорт данных в один клик'],
    image: null,
    detailLink: { label: 'Подробнее', href: `#${LANDING_ANCHORS.features}` },
    galleryImages: landingAssets.galleryAnalytics,
    actions: [{ label: 'Попробовать бесплатно', to: '/register', variant: 'solid-purple', fullWidth: true }],
  },
  {
    id: 'bidder',
    badge: null,
    title: 'Автоматический запуск рекламы',
    description: 'Автоматизируйте запуск и управление рекламой по заданным правилам',
    bullets: ['Автопополнение баланса', 'Запуск рекламной кампании по вашим настройкам', 'Создание нескольких периодов на один день'],
    image: null,
    detailLink: { label: 'Подробнее', href: `#${LANDING_ANCHORS.pricing}` },
    galleryImages: landingAssets.galleryBidder,
    actions: [{ label: 'Попробовать бесплатно', to: '/register', variant: 'solid-purple', fullWidth: true }],
  },
  {
    id: 'agency',
    badge: null,
    title: 'Ведение рекламных кабинетов',
    description: 'Полное ведение рекламы под ключ для стабильного роста продаж',
    bullets: [
      'Стратегия под ваш товар и нишу',
      'Настройка и ведение кампаний',
      'Оптимизация и масштабирование',
      'Прозрачная отчетность и контроль результата',
    ],
    image: null,
    detailLink: { label: 'Подробнее', href: `#${LANDING_ANCHORS.contacts}` },
    galleryImages: null,
    actions: [{ label: 'Заказать услугу', consultationForm: true, variant: 'solid-green', fullWidth: true }],
  },
] as const

export const landingFeatures = [
  {
    title: 'Единая аналитика',
    description: 'Собираем данные со всех рекламных кампаний в одном месте.',
  },
  {
    title: 'Работа со всеми кабинетами',
    description: 'Управляйте всеми кабинетами в одном месте.',
  },
  {
    title: 'Сравнение периодов',
    description: 'Сравнивайте показатели за разные периоды и отслеживайте динамику изменений.',
  },
  {
    title: 'Детальная статистика',
    description: 'Анализируйте показы, клики, CTR, CPC, расходы, заказы и другие ключевые метрики.',
  },
  {
    title: 'Экспорт данных',
    description: 'Выгружайте отчеты в Excel в один клик для дальнейшего анализа и работы с командой.',
  },
  {
    title: 'Прозрачность и отчетность',
    description: 'Получайте понятные отчеты и всегда держите эффективность рекламы под контролем.',
  },
  {
    title: 'Автоматизация рекламы',
    description: 'Автоматизируйте рутинные задачи и сократите время на управление рекламой.',
  },
  {
    title: 'Работа в команде',
    description: 'Предоставляйте доступ сотрудникам и управляйте ролями внутри кабинета.',
  },
] as const

export const landingPricing = [
  {
    id: 'analytics',
    name: 'Аналитика рекламы',
    badge: 'Бесплатно',
    priceLabel: '0 ₽',
    period: '/мес',
    description: 'Используйте все возможности аналитики без ограничений',
    features: [
      'Все функции аналитики',
      'Неограниченное количество кампаний',
      'Экспорт данных',
      'Подходит для всех',
    ],
    popular: false,
    cta: { label: 'Попробовать бесплатно', to: '/register' },
  },
  {
    id: 'bidder',
    name: 'Автоматический запуск рекламы',
    badge: null,
    priceLabel: 'от 1000 ₽',
    period: '/неделя',
    description: 'Автоматизируйте запуск и управление рекламой',
    features: ['Автопополнение баланса', 'Запуск РК по вашим настройкам'],
    popular: false,
    cta: { label: 'Попробовать бесплатно', to: '/register?plan=bidder' },
  },
  {
    id: 'agency',
    name: 'Ведение рекламных кабинетов',
    badge: null,
    priceLabel: 'от 22 500 ₽',
    period: '/2 недели',
    description: 'Запускаем, оптимизируем и масштабируем РК',
    features: [
      'Стратегия и настройка кампаний',
      'Ведение и оптимизация',
      'Отчетность и аналитика',
      'Персональный менеджер',
      'Индивидуальный чат с командой',
    ],
    popular: true,
    cta: { label: 'Хочу консультацию', consultationForm: true },
  },
  {
    id: 'audit',
    name: 'Аудит рекламного\nкабинета',
    badge: null,
    priceLabel: '7 000 ₽',
    period: '/час',
    description: 'Разберем ваш кабинет за 1 час и покажем точки роста',
    features: [
      'Онлайн-встреча до 60 минут',
      'Анализ рекламных кампаний',
      'Поиск причин перерасхода бюджета',
      'Анализ ставок и эффективности рекламы',
      'Рекомендации по увеличению продаж',
      'План действий после консультации',
    ],
    popular: false,
    cta: { label: 'Записаться на аудит', auditForm: true },
  },
] as const

export const landingPricingNote =
  'Сервисы аналитики всегда бесплатны. Вы платите только за дополнительные услуги, если они вам нужны.' as const

export const landingTrustStats = [
  {
    title: 'Экспертность',
    description:
      'Более 3 лет занимаемся исключительно рекламой на Wildberries и работаем с десятками ниш и категорий товаров.',
  },
  {
    title: 'Технологии и автоматизация',
    description:
      'Объединяем возможности собственного сервиса Clicki и сторонних сервисов, чтобы получать максимально полную картину эффективности рекламы',
  },
  {
    title: 'Прозрачность и отчетность',
    description:
      'Предоставляем понятные отчеты, объясняем принятые решения и всегда держим клиентов в курсе результатов.',
  },
  {
    title: 'Поддержка и сопровождение',
    description:
      'Остаемся на связи, оперативно отвечаем на вопросы и помогаем находить точки роста на каждом этапе работы.',
  },
] as const

export const landingCases = [
  {
    id: 'home',
    category: 'Дом и интерьер',
    metrics: [
      { label: 'Рост продаж', value: '3,5×' },
      { label: 'ДРР', value: '−23%' },
    ],
    image: landingAssets.caseHome,
  },
  {
    id: 'cosmetics',
    category: 'Косметика',
    metrics: [
      { label: 'Прибыль', value: '+67%' },
      { label: 'Заказы', value: '+42%' },
    ],
    image: landingAssets.caseCosmetics,
  },
  {
    id: 'clothes',
    category: 'Одежда',
    metrics: [
      { label: 'Расходы', value: '−31%' },
      { label: 'ROAS', value: '+28%' },
    ],
    image: landingAssets.caseClothes,
  },
] as const

export const landingFaq = [
  {
    question: 'Что входит в услугу ведения рекламы?',
    answer:
      'Мы полностью берем на себя работу с рекламными кампаниями: разрабатываем стратегию, запускаем и оптимизируем рекламу, анализируем результаты, контролируем бюджет и регулярно предоставляем отчеты с рекомендациями.',
  },
  {
    question: 'Что входит в консультацию (аудит кабинета)?',
    answer:
      'В течение часовой онлайн-встречи мы проведем аудит вашего рекламного кабинета, разберем текущие рекламные кампании, выявим слабые места, сравним с топовыми игроками, покажем точки роста и подготовим рекомендации, которые помогут повысить эффективность рекламы и увеличить продажи.',
  },
  {
    question: 'Можно ли подключить несколько кабинетов?',
    answer:
      'Да. Clicki позволяет работать сразу с несколькими кабинетами Wildberries в одном интерфейсе. Это особенно удобно для агентств и продавцов с несколькими юридическими лицами.',
  },
  {
    question: 'Можно ли пользоваться только аналитикой без покупки других услуг?',
    answer:
      'Да. Аналитика в Clicki полностью бесплатна и доступна всем пользователям. Вы можете использовать сервис для анализа рекламных кампаний, отслеживания ключевых показателей и поиска точек роста без подключения автоматизации или услуг по ведению рекламы.',
  },
  {
    question: 'Есть ли бесплатный пробный период?',
    answer:
      'Вы можете бесплатно подключить сервис и воспользоваться всеми возможностями раздела аналитики. Если позже решите подключить управление рекламой или заказать сопровождение, сможете выбрать подходящий тариф.',
  },
  {
    question: 'Как часто обновляются данные в аналитике?',
    answer:
      'Данные автоматически синхронизируются с Wildberries и ежедневно обновляются, чтобы вы всегда работали с актуальной информацией. Это позволяет оперативно отслеживать изменения в рекламных кампаниях, анализировать результаты и своевременно принимать решения.',
  },
] as const

export const landingFooterLinks = {
  services: [
    { label: 'Аналитика рекламы', href: `#${LANDING_ANCHORS.services}` },
    { label: 'Автозапуск рекламы', href: `#${LANDING_ANCHORS.services}` },
    { label: 'Ведение кабинетов', href: `#${LANDING_ANCHORS.services}` },
    { label: 'Тарифы', href: `#${LANDING_ANCHORS.pricing}` },
  ],
  company: [
    { label: 'О нас', href: `#${LANDING_ANCHORS.about}` },
    { label: 'Блог', href: `#${LANDING_ANCHORS.blog}` },
    { label: 'FAQ', href: `#${LANDING_ANCHORS.faq}` },
  ],
  support: [
    { label: 'Контакты', href: `#${LANDING_ANCHORS.contacts}` },
    { label: 'Политика конфиденциальности', to: '/privacy' },
    { label: 'Пользовательское соглашение', to: '/user-agreement' },
  ],
} as const

export const landingBlogTeaser = {
  title: 'Блог Clicki',
  description: 'Скоро здесь появятся статьи о рекламе и аналитике на Wildberries. Подпишитесь на рассылку — напишите нам на corp@click-i.ru',
} as const
