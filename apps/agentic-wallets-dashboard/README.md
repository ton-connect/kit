# Agentic Wallets Dashboard

Веб-приложение для управления `agentic wallet` в сети TON:
- просмотр найденных agent-кошельков владельца;
- создание нового agent-кошелька с первичным фондированием;
- пополнение, вывод активов, смена ключа оператора, revoke;
- просмотр activity-ленты по агенту.

Приложение построено на `React + Vite + @tanstack/react-query + @ton/appkit-react`.

## Роуты

- `/` — дашборд со списком агентов.
- `/create` — форма создания агента.
- `/agent/:id` — карточка конкретного агента.

## Основной функционал

1. Обнаружение агентов владельца:
- загрузка NFT владельца;
- фильтрация по configured collection;
- дозагрузка on-chain state кошельков.

2. Создание агента (`/create`):
- ввод `origin operator public key`, имени и источника;
- расчёт индекса и детерминированного адреса agent-кошелька;
- deploy + первичное фондирование TON и/или ассетами в одном флоу.

3. Операции по агенту:
- `fund` (TON / jetton / NFT);
- `withdraw all` (или выборочно, в зависимости от UI-модалки);
- `revoke` (установка operator key в `0`);
- `change public key`;
- `rename`.

4. Activity feed:
- классификация действий (`ton`, `jetton`, `nft`, `swap`, `contract`, `agent_ops`);
- дедуп по hash;
- периодический polling (`VITE_AGENTIC_ACTIVITY_POLL_MS`).

## Deep Link автозаполнение `/create`

Поддержано автозаполнение всех параметров формы через query-параметры URL.

Базовый формат:

`https://<host>/create?...`

### Поддерживаемые scalar-параметры

- `originOperatorPublicKey` (алиасы: `operatorPublicKey`, `operatorPubkey`, `operator`, `pubkey`)
- `agentName` (алиас: `name`)
- `source`
- `tonDeposit` (алиасы: `ton`, `tonAmount`)

### Поддерживаемые параметры ассетов

Есть 3 формата:

1. `assets=<json-array>`
- JSON-массив объектов вида:
  - `{"kind":"jetton","address":"EQ...","amount":"12.5"}`
  - `{"kind":"nft","address":"EQ..."}`
  - для fallback-мэтчинга также поддержаны `symbol` и `label`.
- JSON должен быть URL-encoded.

2. Повторяемый `asset`
- `asset=jetton:<address>:<amount>`
- `asset=nft:<address>`

3. Повторяемые `jetton` / `nft`
- `jetton=<address>:<amount>`
- `nft=<address>`

### Поведение автозаполнения

- Scalar-поля применяются один раз при открытии страницы.
- Ассеты применяются после загрузки списков jetton/NFT владельца.
- Мэтчинг ассетов:
  - сначала по адресу (нормализованное сравнение TON-адресов),
  - при `assets=<json-array>` возможен fallback по `symbol/label`.
- Неизвестные/недоступные ассеты игнорируются.
- Для `jetton` подставляется `amount`, для `nft` amount не используется.
- Применяется ограничение по числу ассетов (`max outgoing messages - 1`).

### Примеры deep link

1. Минимальный:

`/create?operator=0x1234&name=Research%20Agent&source=telegram-bot&ton=0.2`

2. Через `asset`:

`/create?pubkey=0x1234&agentName=Ops%20Agent&asset=jetton:EQC...:15.75&asset=nft:EQD...`

3. Через JSON `assets`:

`/create?originOperatorPublicKey=0x1234&agentName=A1&source=api&tonDeposit=0.35&assets=%5B%7B%22kind%22%3A%22jetton%22%2C%22address%22%3A%22EQC...%22%2C%22amount%22%3A%2212.5%22%7D%2C%7B%22kind%22%3A%22nft%22%2C%22address%22%3A%22EQD...%22%7D%5D`

## Конфигурация окружения

Файл: `src/core/configs/env.ts`.

Ключевые переменные:
- `VITE_TON_API_KEY`
- `VITE_TON_API_TESTNET_KEY`
- `VITE_TON_API_MIN_REQUEST_INTERVAL_MS`
- `VITE_AGENTIC_COLLECTION_MAINNET`
- `VITE_AGENTIC_COLLECTION_TESTNET`
- `VITE_AGENTIC_WALLET_CODE_BOC`
- `VITE_AGENTIC_OWNER_OP_GAS`
- `VITE_AGENTIC_ACTIVITY_POLL_MS`

## Запуск

Из `ui_appkit/apps/agentic-wallets-dashboard`:

- `pnpm dev` — локальный dev-сервер (`5175`)
- `pnpm typecheck`
- `pnpm build`
- `pnpm preview`

## Технические замечания

- Используется `BrowserRouter`; для прямых переходов по `/create` и `/agent/:id` сервер должен отдавать `index.html` (SPA fallback).
- Для on-chain запросов используется `ApiClientTonApi` через `AppKit`.
