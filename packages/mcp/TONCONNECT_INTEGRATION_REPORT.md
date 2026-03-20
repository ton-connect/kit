# Отчёт: возможность внедрения TonConnect-инструментов в `packages/mcp`

## Что уже есть в монорепе

### В `packages/mcp`

- `packages/mcp` уже зависит от `@ton/walletkit`, прямых новых протокольных зависимостей для TonConnect на старте не требуется: `packages/mcp/package.json`.
- Сервер собирается как набор MCP tools, регистрируемых через `createTonWalletMCP(...)`: `packages/mcp/src/factory.ts:87`.
- Все write-tools в текущей модели предполагают, что MCP уже владеет локальным `WalletAdapter` и может подписывать транзакции напрямую: `packages/mcp/src/factory.ts:104`, `packages/mcp/src/factory.ts:174`, `packages/mcp/src/services/McpWalletService.ts:390`, `packages/mcp/src/services/McpWalletService.ts:661`.
- В registry mode контекст кошелька создаётся на время вызова одного инструмента и затем закрывается: `packages/mcp/src/factory.ts:188`, `packages/mcp/src/factory.ts:197`.
- Runtime для кошельков сейчас поднимает `TonWalletKit` с `MemoryStorageAdapter`, то есть без устойчивого хранения TonConnect-сессий: `packages/mcp/src/runtime/wallet-runtime.ts:39`, `packages/mcp/src/runtime/wallet-runtime.ts:45`.
- Даже внутренний `TonWalletKit`, который `McpWalletService` использует для swap-операций, тоже инициализируется с `MemoryStorageAdapter`: `packages/mcp/src/services/McpWalletService.ts:417`, `packages/mcp/src/services/McpWalletService.ts:428`.

### В `packages/walletkit`

- В `@ton/walletkit` уже есть встроенная TonConnect-функциональность: обработка URL, список сессий, approve/reject connect, approve/reject transaction, approve/reject signData, callbacks на события: `packages/walletkit/src/types/kit.ts:72`, `packages/walletkit/src/types/kit.ts:80`, `packages/walletkit/src/types/kit.ts:88`, `packages/walletkit/src/types/kit.ts:97`, `packages/walletkit/src/types/kit.ts:109`, `packages/walletkit/src/types/kit.ts:120`.
- `TonWalletKit` уже умеет принимать TonConnect universal link через `handleTonConnectUrl(...)`: `packages/walletkit/src/core/TonWalletKit.ts:531`.
- `TonWalletKit` уже умеет approve/reject запросы протокола: `packages/walletkit/src/core/TonWalletKit.ts:657`, `packages/walletkit/src/core/TonWalletKit.ts:671`, `packages/walletkit/src/core/TonWalletKit.ts:687`.
- При инициализации `TonWalletKit` сам поднимает `BridgeManager`, `EventRouter` и `SessionManager`: `packages/walletkit/src/core/Initializer.ts:146`, `packages/walletkit/src/core/Initializer.ts:165`, `packages/walletkit/src/core/Initializer.ts:177`.
- В `walletkit` уже есть зависимости `@tonconnect/bridge-sdk`, `@tonconnect/protocol` и `@tonconnect/sdk`: `packages/walletkit/package.json:97`.

## Что требует TonConnect по официальной документации

- Для wallet-side интеграции нужны сессии, universal links, bridge (`https://connect.ton.org/bridge`), обработка connect/sendTransaction/signData и последующий disconnect.
- Для протокольного слоя рекомендовано использовать `@tonconnect/protocol`.
- Для HTTP bridge используются два базовых канала: `GET /events?...` для получения событий и `POST /message?...` для отправки сообщений.
- Wallet должен объявлять поддерживаемые возможности через `deviceInfo.features` и `walletManifest`.
- Для `SendTransaction` wallet сообщает `maxMessages`; для `SignData` объявляет поддерживаемые типы (`text`, `binary`, `cell`).

Официальные источники:

- TonConnect specification: https://github.com/ton-blockchain/ton-connect
- TON Docs, WalletKit native/web integration: https://docs.ton.org/ecosystem/walletkit/native-web
- TON Docs, WalletKit web init: https://docs.ton.org/ecosystem/walletkit/web/init
- TON Docs, TON Connect manifests: https://docs.ton.org/ecosystem/ton-connect/manifest
- `@tonconnect/protocol` docs: https://ton-connect.github.io/sdk/modules/_tonconnect_protocol.html

## `packages/mcp` как wallet-side TonConnect обработчик

Это путь вида: dApp генерирует TonConnect link, пользователь передаёт ссылку в MCP, а `packages/mcp` выступает кошельком, принимает connect/sendTransaction/signData запросы и даёт approve/reject.

#### Плюсы

- Это уже поддерживается на уровне `@ton/walletkit`.
- Это совпадает с текущей моделью `packages/mcp`, где сервер уже контролирует ключи или operator key agentic-кошелька.
- Логика approve/reject естественно маппится на MCP tools.
- Не нужен браузерный UI как обязательная часть архитектуры.

#### Минусы

- TonConnect здесь асинхронный и stateful, а `packages/mcp` сейчас mostly request/response и часто живёт в модели "создал контекст на один tool call, потом закрыл".
- Нужно долговременное хранение TonConnect-сессий и очереди входящих запросов.
- Нужно аккуратно спроектировать manifest/config и безопасное хранение session keys.
- Это возможно только в режиме MCP (в raw CLI невозможно), потому что bridge и SSE требуют долгоживущего процесса или внешнего stateful backend.

## Основные архитектурные ограничения, которые нужно учесть

### 1. Текущий lifecycle кошелька слишком короткий

В registry mode `createWalletService(...)` поднимает контекст на один вызов инструмента и сразу закрывает его. Для TonConnect этого недостаточно, потому что:

- после `connect` нужно держать bridge-сессию;
- затем нужно принимать входящие `sendTransaction` и `signData`;
- потом нужна возможность восстановить сессию после рестарта.

Следствие: TonConnect нельзя встраивать как ещё один "обычный tool поверх временного `McpWalletService`".

### 2. Нужен persistent storage вместо `MemoryStorageAdapter`

И runtime кошельков, и внутренний `TonWalletKit` в `McpWalletService` используют память. Для TonConnect это подходит только для very short-lived demo, но не для production-like MCP.

Нужен либо:

- отдельный storage для TonConnect sessions/events;
- либо расширение существующего `~/.config/ton/config.json`;
- либо отдельный файл наподобие `~/.config/ton/tonconnect-sessions.json`.

### 3. Нужна прослойка между callback/event model и MCP tools

TonConnect поставляет события callback-ами, а MCP tools вызываются pull-моделью. Значит, нужен промежуточный буфер:

- очередь pending requests;
- статусы `pending`, `approved`, `rejected`, `expired`;
- stable `requestId`, чтобы отдельные tools могли адресовать конкретный connect/tx/signData request.

### 4. Нужна явная конфигурация wallet manifest

Для wallet-side TonConnect нужны как минимум:

- `name` и `appName`;
- `imageUrl`;
- `aboutUrl`;
- `platforms`;
- `universalLink`;
- `bridgeUrl` (`https://connect.ton.org/bridge`);
- `features`.

Для `mcp` это лучше хранить в конфиге или env, а не хардкодить внутри сервиса.

## Рекомендуемая архитектура внедрения

### Новый service-слой

Рекомендую добавить отдельный сервис, условно `TonConnectRuntimeService`, а не расширять `McpWalletService` всеми обязанностями сразу.

Зона ответственности нового сервиса:

- держать долгоживущий `TonWalletKit` на активный wallet context;
- подписываться на `onConnectRequest`, `onTransactionRequest`, `onSignDataRequest`, `onDisconnect`, `onRequestError`;
- складывать события в persistent queue/store;
- отдавать инструментарий для approve/reject;
- уметь list/disconnect sessions;
- корректно закрываться вместе с MCP server.

### Предлагаемый набор новых MCP tools

- `tonconnect_handle_url`
  Принимает universal link или raw TonConnect URL и подключает кошелек к dApp.
- `tonconnect_list_requests`
  Возвращает pending и recent requests.
- `tonconnect_approve_request`
  Подтверждает входящий `sendTransaction` или `signData`.
- `tonconnect_reject_request`
  Отклоняет входящий `sendTransaction` или `signData`.
- `tonconnect_list_sessions`
  Возвращает активные TonConnect sessions.
- `tonconnect_disconnect`
  Разрывает конкретную сессию или все сессии.
- `tonconnect_get_status`
  Возвращает состояние runtime, bridge и storage.

### Где регистрировать инструменты

Логично добавить новый модуль `src/tools/tonconnect-tools.ts` и зарегистрировать его рядом с остальными tools через `src/tools/index.ts` и `src/factory.ts`.

Но в отличие от обычных wallet tools, TonConnect tools должны работать не через ephemeral `createWalletService(...).close()`, а через отдельный кэш долгоживущих runtime-инстансов по `walletSelector`.


- Сделать runtime cache по `walletSelector`.
- Ввести конфиг и lifecycle policy: lazy start, explicit stop, close on server shutdown.
- Разобрать поведение при смене active wallet.

## Что я бы не делал в первой версии

- Не пытался бы тащить `@tonconnect/ui` внутрь `packages/mcp` как основной путь.
- Не пытался бы делать полноценный dApp-side TonConnect client без companion UI.
- Не включал бы TonConnect в serverless mode.
- Не смешивал бы TonConnect session store с текущими transient runtime-объектами.

## Основные риски

- Асинхронность TonConnect плохо совпадает с одноразовым lifecycle текущих registry tools.
- При неверном storage-дизайне можно потерять сессии после рестарта.
- При неправильном логировании можно утечь session secret keys.
- Если не выделить отдельный runtime manager, код `factory.ts` быстро станет трудно поддерживать.
- Если сразу пытаться поддержать и wallet-side, и dApp-side сценарии, объём и сложность реализации вырастут непропорционально.
