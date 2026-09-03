# Solution Frontend

SPA кабинета Clicki: аналитика и реклама WB/Ozon, управление РК, А/Б-тесты (WB), профиль, кабинеты, подписки, админка, юридические страницы и лендинг.

Обзор репозитория и запуск с бэкендом — в [корневом README](../README.md).

## Технологии

- React 18, TypeScript
- Vite 5
- Ant Design 5, `@ant-design/icons`
- React Router 6
- TanStack Query 5
- Axios, Zustand, Day.js
- Recharts, SheetJS (`xlsx`)

## Быстрый старт

```bash
cd solution_front
npm install
npm run dev
```

Приложение: **http://localhost:5173**

Прокси в `vite.config.ts`: **`/api`** → **`http://localhost:8080`** (на бэке context-path уже `/api`, путь не переписывается).

### Скрипты

| Команда | Действие |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | `tsc` + сборка в `dist/` |
| `npm run preview` | Просмотр `dist/` |
| `npm run lint` | ESLint |

## Маршруты

Задаются в `src/App.tsx`.

| Путь | Экран |
|------|--------|
| `/` | Лендинг |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/confirm-email` | Аккаунт |
| `/invite/:token` | Приглашение в кабинет |
| `/analytics` | Сводка |
| `/analytics/products` | Товары (домашняя страница кабинета) |
| `/analytics/article/:nmId` | Карточка артикула |
| `/advertising/campaigns` | Список РК |
| `/advertising/campaigns/:id` | Карточка РК |
| `/advertising/campaigns/:id/manage` | Управление РК |
| `/advertising/bidder` | Биддер |
| `/advertising/ab-test`, `/advertising/ab-test/:id` | А/Б-тесты (WB) |
| `/profile` | Профиль |
| `/cabinets/:id` | Карточка кабинета (`/cabinets` редирект в профиль) |
| `/subscribe`, `/subscription` | Тарифы и подписка |
| `/subscription/success`, `/subscription/fail` | Результат оплаты Точка |
| `/admin/plans`, `/admin/promo-codes`, `/admin/deletion-requests`, `/admin/api-events` | Админка (`/admin/wb-events` → `/admin/api-events`) |
| `/privacy`, `/oferta`, `/refund`, `/user-agreement` | Юридические |

Защищённые разделы: **`AccessGuard`** (подтверждение email, подписка, учебная витрина без кабинетов) и **`CabinetSectionGuard`** (грант на секцию выбранного кабинета). **ADMIN** после подтверждения почты не упирается в подписку и онбординг без кабинетов.

## Структура `src/`

| Каталог / файл | Назначение |
|----------------|------------|
| `api/` | Axios-клиенты: `client.ts` (JWT, 401), `auth`, `analytics`, `cabinets`, `user`, `admin`, `subscription`, `campaignManage`, `abTest`, `invitations`, `public` |
| `pages/` | Экраны; профиль — `pages/profile/`, кабинеты — `pages/cabinets/` |
| `components/` | Шапка, футер, гарды, графики, онбординг, биддер |
| `hooks/` | Контекст кабинета, доступы к секциям, админ-панель кабинета |
| `onboarding/` | Туры и демо без кабинетов |
| `store/` | `authStore` (JWT, роль), `onboardingStore` |
| `types/` | `api.ts`, `analytics.ts` |
| `constants/`, `utils/`, `styles/` | Константы, хелперы, токены аналитики |
| `App.tsx`, `main.tsx` | Маршруты и провайдеры |

## API

- Префикс **`/api`** (в dev — прокси Vite).
- **`Authorization: Bearer`** — JWT из `localStorage` (`api/client.ts`, `authStore`).
- Роль в токене: `ADMIN` или `USER`. Тип аккаунта (SELLER / AGENCY / EMPLOYEE) и гранты кабинета приходят с бэкенда.

Пути методов — [solution_back/README.md](../solution_back/README.md).

## UI

Палитра и акцентный `#B4D705` — в корневом `PROJECT_NOTES.md` (раздел «Дизайн»). Тема Ant Design — `main.tsx` и `index.css`. Бейдж маркетплейса: `MarketplaceTypeTag`.

## Docker

Образ из **`Dockerfile`** этого каталога (Node 20 → Nginx). В **`solution_back/docker-compose.yml`** контекст по умолчанию **`../solution-front`**. Если папка называется **`solution_front`**, измените `context`. Nginx: `nginx.conf` (прокси `/api` на `backend:8080`, HTTPS click-i.ru, редирект со старого wb-solution.ru).

## Разработка

1. Страница: компонент в `pages/`, маршрут в `App.tsx`, при необходимости `AccessGuard` / `CabinetSectionGuard`.
2. API: методы в `api/`, типы в `types/`.
3. Списки с фильтрами — значения в `constants/`, пагинация на сервере.
4. Онбординг: туры в `onboarding/tours/`, демо — `components/onboarding/demo/`.
