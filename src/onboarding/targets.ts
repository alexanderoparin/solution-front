/** data-tour-id атрибуты для шагов обучалки */
export const ONBOARDING_TARGETS = {
  SUBSCRIPTION_BADGE: 'onboarding-subscription-badge',
  SUBSCRIPTION_CARD: 'onboarding-subscription-card',
  ADD_CABINET: 'onboarding-add-cabinet',
  GRANTED_ACCESS: 'onboarding-granted-access',
  MAIN_NAV: 'onboarding-main-nav',
  HELP_BUTTON: 'onboarding-help-button',
  /** Кнопка «Фильтр» на /analytics/products */
  PRODUCTS_FILTER: 'onboarding-products-filter',
  /** Колонки заказов по дням (на всех th дат один id) */
  PRODUCTS_ORDERS_BY_DAY: 'onboarding-products-orders-by-day',
  /** Колонка «Динамика» */
  PRODUCTS_DYNAMICS: 'onboarding-products-dynamics',
  /** Кнопка «Фильтр» на /analytics (Сводная) */
  SUMMARY_FILTER: 'onboarding-summary-filter',
  /** Кнопка «+» — добавить период */
  SUMMARY_ADD_PERIOD: 'onboarding-summary-add-period',
  /** DatePicker периода для сравнения */
  SUMMARY_PERIOD_DATES: 'onboarding-summary-period-dates',
  /** Стрелка раскрытия списка артикулов в таблице */
  SUMMARY_METRIC_EXPAND: 'onboarding-summary-metric-expand',
  /** Кнопка «Обновить все РК» */
  CAMPAIGNS_REFRESH: 'onboarding-campaigns-refresh',
  /** Период статистики по кампаниям */
  CAMPAIGNS_PERIOD: 'onboarding-campaigns-period',
  /** Название кампании (ссылка в деталку) */
  CAMPAIGNS_NAME: 'onboarding-campaigns-name',
  /** Артикулы в кампании */
  CAMPAIGN_DETAIL_ARTICLES: 'onboarding-campaign-detail-articles',
  /** Чекбоксы показателей (Общая / Реклама / Цены) */
  CAMPAIGN_DETAIL_METRICS: 'onboarding-campaign-detail-metrics',
  /** Переключатель «График» */
  CAMPAIGN_DETAIL_CHART: 'onboarding-campaign-detail-chart',
  /** Кнопка «Выгрузить» */
  CAMPAIGN_DETAIL_EXPORT: 'onboarding-campaign-detail-export',
  /** Ссылка «Управление →» */
  CAMPAIGN_DETAIL_MANAGE: 'onboarding-campaign-detail-manage',
  /** DatePicker периодов сравнения */
  CAMPAIGN_DETAIL_COMPARE_PERIODS: 'onboarding-campaign-detail-compare-periods',
  /** Select артикула для остатков */
  CAMPAIGN_DETAIL_STOCK_ARTICLE: 'onboarding-campaign-detail-stock-article',
  /** Переключатель FBO / FBS */
  CAMPAIGN_DETAIL_STOCK_FULFILLMENT: 'onboarding-campaign-detail-stock-fulfillment',
  /** Треугольник раскрытия размеров склада */
  CAMPAIGN_DETAIL_STOCK_EXPAND: 'onboarding-campaign-detail-stock-expand',
  /** Статус и переключатель автозапуска на /advertising/bidder */
  BIDDER_STATUS: 'onboarding-bidder-status',
  /** Название кампании (ссылка в настройки) */
  BIDDER_CAMPAIGN_NAME: 'onboarding-bidder-campaign-name',
  /** Артикулы на странице управления РК */
  CAMPAIGN_MANAGE_ARTICLES: 'onboarding-campaign-manage-articles',
  /** Ссылка «Статистика кампании →» */
  CAMPAIGN_MANAGE_STATS_LINK: 'onboarding-campaign-manage-stats-link',
  /** Блок настроек автопополнения */
  CAMPAIGN_MANAGE_AUTO_BUDGET: 'onboarding-campaign-manage-auto-budget',
  /** Кнопка «Сохранить» / «Редактировать» автопополнения */
  CAMPAIGN_MANAGE_AUTO_BUDGET_SAVE: 'onboarding-campaign-manage-auto-budget-save',
  /** Переключатель расписания */
  CAMPAIGN_MANAGE_SCHEDULE_TOGGLE: 'onboarding-campaign-manage-schedule-toggle',
  /** Сетка расписания (создание слотов) */
  CAMPAIGN_MANAGE_SCHEDULE_GRID: 'onboarding-campaign-manage-schedule-grid',
  /** График бюджета */
  CAMPAIGN_MANAGE_BUDGET_CHART: 'onboarding-campaign-manage-budget-chart',
} as const
