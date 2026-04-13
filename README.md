# Solution Frontend

SPA кабинета Solution для продавцов Wildberries: аналитика по товарам, рекламные кампании, профиль, подписки, юридические страницы.

Общий обзор репозитория и запуск вместе с бэкендом — в [корневом README](../README.md).

## Технологии

- React 18, TypeScript
- Vite 5
- Ant Design 5, `@ant-design/icons`
- React Router 6
- TanStack Query (React Query) 5
- Axios
- Zustand
- Day.js
- Recharts
- SheetJS (`xlsx`) — экспорт таблиц

## Быстрый старт

```bash
cd solution_front
npm install
npm run dev
```

Приложение: **http://localhost:5173**

Прокси в `vite.config.ts`: запросы на **`/api`** уходят на **`http://localhost:8080`** (на бэке контекстный путь уже `/api`, путь не переписывается).

### Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | Режим разработки |
| `npm run build` | `tsc` + production-сборка в `dist/` |
| `npm run preview` | Локальный просмотр собранного `dist/` |
| `npm run lint` | ESLint |

## Структура `src/`

| Каталог / файл | Назначение |
|----------------|------------|
| `api/` | Клиенты API: `client.ts` (axios, JWT, 401), `auth.ts`, `analytics.ts`, `cabinets.ts`, `user.ts`, `admin.ts`, `subscription.ts` |
| `pages/` | Экраны: лендинг, логин/регистрация, аналитика (`AnalyticsSummary`, `AnalyticsProducts`, `AnalyticsArticle`), РК (`AdvertisingCampaigns`, `AdvertisingCampaignDetail`), профиль, подписки, админка, публичные Oferta/Privacy/Refund |
| `components/` | `Header`, `Footer`, `Breadcrumbs`, `AccessGuard`, графики, модалки, блоки кабинетов и т.д. |
| `hooks/` | `useWorkContextForManagerAdmin`, `useCabinetAdminPanel` и др. |
| `store/` | `authStore` — токен, роль, userId |
| `types/` | `api.ts`, `analytics.ts` |
| `styles/` | Общие токены для аналитики (`analytics.ts`) |
| `constants/` | Сортировки и перечисления без магических строк |
| `utils/` | Вспомогательные функции (очередь запросов, файлы из буфера, ссылки в тексте и т.п.) |
| `App.tsx` | Маршруты и редиректы |
| `main.tsx` | Точка входа, провайдеры (Ant Design locale, QueryClient) |

Маршруты после входа: стартовый путь задаётся в `App.tsx` (сейчас **`/analytics/products`**). Защищённые разделы обёрнуты в **`AccessGuard`** (подписка, подтверждение email; **ADMIN** и **MANAGER** проходят без этих проверок).

## API

- Префикс: **`/api`** (в dev через прокси Vite).
- Заголовок **`Authorization`**: Bearer JWT (токен в `localStorage`, см. `api/client.ts`, `authStore`).

Детальные пути — на стороне бэкенда; см. `solution_back/README.md`.

## UI и тема

Акцентный цвет и нейтральная палитра описаны в корневом **`PROJECT_NOTES.md`** (раздел про дизайн). Ant Design настраивается в `main.tsx` и `index.css`.

## Docker

Production-образ фронта собирается из **`Dockerfile`** в этом каталоге; в **`solution_back/docker-compose.yml`** контекст сборки по умолчанию указан как **`../solution-front`**. При имени каталога **`solution_front`** измените `context` в compose на родительский путь с подчёркиванием.

## Разработка

1. Новая страница: компонент в `pages/`, маршрут в `App.tsx`, при необходимости обёртка `AccessGuard`.
2. Новые вызовы API: методы в `api/`, типы в `types/`.
3. Списочные экраны с сортировкой/фильтрами — держать значения в **`constants/`**, по возможности серверная пагинация/фильтрация для больших объёмов.
