# План внедрения TonConnect в `packages/mcp`

## Цель

Добавить в `packages/mcp` wallet-side поддержку TonConnect, при которой MCP-сервер принимает TonConnect URL, держит bridge-сессии, получает `connect` / `sendTransaction` / `signData` запросы от dApp и даёт пользователю инструменты для approve/reject через MCP tools.

План опирается на выводы из [`TONCONNECT_INTEGRATION_REPORT.md`](./TONCONNECT_INTEGRATION_REPORT.md) и текущую архитектуру `packages/mcp`.

## Основные ограничения текущей реализации

1. В registry mode wallet context создаётся на один tool call и сразу закрывается, что несовместимо с TonConnect-сессиями.
2. `TonWalletKit` в runtime и `McpWalletService` использует `MemoryStorageAdapter`, поэтому сессии не переживут рестарт процесса.
3. MCP tools работают по pull-модели, а TonConnect приходит событиями и callback-ами.
4. Для TonConnect нужен отдельный manifest/config и аккуратное хранение session state без утечки секретов.
5. Serverless mode не подходит для первой версии из-за необходимости долгоживущего runtime.

## Целевой scope v1

- Поддержать wallet-side сценарий для registry mode и single-wallet mode.
- Поддержать обработку TonConnect universal link через MCP tool.
- Поддержать persistent session storage и persistent request queue.
- Поддержать `connect`, `sendTransaction`, `signData`, `disconnect`.
- Дать набор MCP tools для просмотра, approve/reject и завершения сессий.
- Исключить поддержку Tonconnect в serverless mode в первой версии.
- Не реализовывать dApp-side TonConnect client и UI.

## Архитектурное решение

### 1. Ввести отдельный long-lived runtime для TonConnect

Нужен отдельный сервис, условно `TonConnectRuntimeService`, который не зависит от краткоживущего `createWalletService(...).close()` в [`src/factory.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/factory.ts).

Ответственность сервиса:

- поднимать и держать `TonWalletKit` на время жизни MCP server;
- подписываться на `onConnectRequest`, `onTransactionRequest`, `onSignDataRequest`, `onDisconnect`, `onRequestError`;
- нормализовать входящие события в единый формат запросов;
- складывать pending/recent requests в persistent store;
- предоставлять методы `handleUrl`, `approveRequest`, `rejectRequest`, `listRequests`, `listSessions`, `disconnect`;
- корректно закрывать runtime при `server.close()`.

### 2. Разделить runtime manager и wallet service

`McpWalletService` не стоит перегружать TonConnect-логикой. Лучше добавить отдельный manager-слой:

- `TonConnectRuntimeService` для работы с одним wallet context;
- `TonConnectRuntimeRegistry` для кеша runtime-инстансов по `walletSelector` или `walletId`;
- интеграцию с `WalletRegistryService` только на уровне резолва кошелька и конфигурации.

### 3. Вынести TonConnect storage в отдельный persistent store

Первая версия не должна использовать `MemoryStorageAdapter` для TonConnect state.

Рекомендуемая схема:

- отдельный storage-файл, например `~/.config/ton/tonconnect.json`;
- хранить отдельно:
  - runtime metadata;
  - active sessions;
  - pending/recent requests;
  - manifest/config;
  - timestamps и TTL;
- не логировать и не возвращать наружу session secrets / bridge keys.

Практически это лучше оформить отдельным store-классом, а не расширять напрямую [`src/registry/config.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/registry/config.ts) без слоя абстракции.

### 4. Сделать явную модель состояний запросов

Нужен стабильный request lifecycle:

- `pending`
- `approved`
- `rejected`
- `expired`
- `failed`

Для каждого request хранить:

- `requestId`
- `sessionId`
- `walletId`
- `type` (`connect`, `sendTransaction`, `signData`)
- `origin` / dApp metadata
- payload summary
- timestamps
- статус и reason/error при наличии

## Предлагаемые изменения по слоям

### Этап 1. Подготовить конфигурацию и storage

Изменения:

- добавить типы TonConnect config и store entities;
- определить путь к persistent storage;
- добавить env/config для manifest и runtime policy;
- описать политику TTL и очистки завершённых запросов.

Новые сущности:

- `src/types/tonconnect.ts`
- `src/services/TonConnectStore.ts`
- `src/services/TonConnectConfigService.ts` или аналог

Минимальные настройки v1:

- `TONCONNECT_APP_NAME`
- `TONCONNECT_MANIFEST_NAME`
- `TONCONNECT_MANIFEST_IMAGE_URL`
- `TONCONNECT_MANIFEST_ABOUT_URL`
- `TONCONNECT_UNIVERSAL_LINK`
- `TONCONNECT_BRIDGE_URL` с default `https://connect.ton.org/bridge`
- `TONCONNECT_STORAGE_PATH` при необходимости override

Критерий готовности:

- runtime может восстановить сохранённые сессии и pending requests после рестарта;
- storage не ломает существующий `TON_CONFIG_PATH`.

### Этап 2. Реализовать long-lived TonConnect runtime

Изменения:

- добавить сервис, который создаёт `TonWalletKit` с persistent storage;
- вынести lifecycle `start`, `restore`, `close`, `healthCheck`;
- отделить runtime от одноразового `McpWalletService`.

Новые/изменяемые файлы:

- новый [`src/services/TonConnectRuntimeService.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/services/TonConnectRuntimeService.ts)
- новый [`src/services/TonConnectRuntimeRegistry.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/services/TonConnectRuntimeRegistry.ts)
- изменение [`src/runtime/wallet-runtime.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/runtime/wallet-runtime.ts) для создания runtime без жёсткой привязки к `MemoryStorageAdapter`

Критерий готовности:

- runtime создаётся лениво по первому TonConnect tool call;
- runtime переиспользуется между вызовами tools;
- shutdown закрывает runtime без висящих bridge-соединений.

### Этап 3. Связать event model TonConnect с MCP pull tools

Изменения:

- подписаться на callbacks `TonWalletKit`;
- нормализовать входящие события в очередь запросов;
- добавить выборку pending/recent requests;
- обеспечить дедупликацию и TTL.

Новые сущности:

- `TonConnectRequestQueue`
- мапперы payload -> tool-friendly summaries

Технические требования:

- пользователь должен видеть безопасное summary запроса, а не сырые protocol payloads по умолчанию;
- для `sendTransaction` нужен summary по messages, amount, destination, validUntil;
- для `signData` нужен summary по типу данных и origin;
- для `connect` нужен summary по dApp и requested features.

Критерий готовности:

- входящий TonConnect request появляется в `list_requests` без участия UI;
- request адресуется по стабильному `requestId`.

### Этап 4. Добавить MCP tools для TonConnect

Рекомендуемый набор tools:

- `tonconnect_handle_url`
- `tonconnect_list_requests`
- `tonconnect_approve_request`
- `tonconnect_reject_request`
- `tonconnect_list_sessions`
- `tonconnect_disconnect`
- `tonconnect_get_status`

Где менять:

- новый [`src/tools/tonconnect-tools.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/tools/tonconnect-tools.ts)
- обновить [`src/tools/index.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/tools/index.ts)
- обновить [`src/factory.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/factory.ts)

Особенности регистрации:

- в registry mode TonConnect tools должны работать через `TonConnectRuntimeRegistry`, а не через `registry.createWalletService(...).close()`;
- в single-wallet mode можно держать один singleton runtime на сервер;
- нужно привязать `server.close()` к закрытию TonConnect runtime manager.

Критерий готовности:

- tools доступны в MCP и работают одинаково предсказуемо в stdio и HTTP mode;
- tools явно сообщают, что TonConnect не поддерживается в serverless mode.

### Этап 5. Подтверждение транзакций и signData

Изменения:

- реализовать approve/reject flow для `sendTransaction` и `signData`;
- валидировать request state перед подтверждением;
- исключить повторное подтверждение одного и того же request;
- возвращать пользователю детальный результат операции.

Нужно проверить:

- как `TonWalletKit` ждёт подтверждение и как долго request остаётся валидным;
- какой минимум данных нужно сохранять для корректного восстановления после рестарта;
- как обрабатывать disconnect/expired во время pending request.

Критерий готовности:

- approve/reject меняет состояние запроса в store;
- dApp получает результат через bridge;
- повторный approve/reject на завершённом request даёт ожидаемую ошибку.

### Этап 6. Обновить transport-specific lifecycle

Изменения:

- зафиксировать поддержку TonConnect только для stdio и HTTP mode;
- добавить инициализацию runtime manager в server startup;
- описать поведение reconnect и multi-session HTTP.

Где менять:

- [`src/http-mode.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/http-mode.ts)
- [`src/cli.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/cli.ts)
- при необходимости [`src/serverless.ts`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/src/serverless.ts) только для явного отказа

Критерий готовности:

- transport lifecycle не убивает TonConnect runtime после каждого вызова;
- документация явно различает поддерживаемые и неподдерживаемые режимы.

### Этап 7. Тесты

Нужны тесты трёх уровней:

1. Unit
- store serialization/deserialization;
- queue state transitions;
- manifest/config validation;
- approve/reject guards.

2. Integration
- lazy runtime creation;
- restore после рестарта;
- регистрация tools в `factory`;
- закрытие runtime при `server.close()`.

3. Protocol-facing mocks
- входящий connect request;
- входящий sendTransaction request;
- входящий signData request;
- disconnect и request expiration.

Вероятные файлы:

- `src/__tests__/tonconnect-store.spec.ts`
- `src/__tests__/tonconnect-runtime.spec.ts`
- `src/__tests__/tonconnect-tools.spec.ts`
- дополнения в существующие `factory.spec.ts` и `http-mode.spec.ts`

Критерий готовности:

- покрыты happy path и основные failure modes;
- тесты не требуют реального bridge в CI, если это можно изолировать mock-слоем.

### Этап 8. Документация и rollout

Изменения:

- обновить [`README.md`](/Users/arkadiystena/Desktop/Тонтех/agentic_wallets/ui_appkit/packages/mcp/README.md) с описанием новых tools и env vars;
- добавить отдельный раздел по TonConnect lifecycle;
- описать ограничения безопасности и режимы поддержки;
- при необходимости обновить `llms.txt` и `CHANGELOG.md`.

Критерий готовности:

- пользователь понимает, как передать universal link, как увидеть pending requests и как подтвердить запрос;
- описано, где лежит persistent state и как его чистить.

## Риски и меры снижения

### Потеря сессий после рестарта

Мера: отдельный persistent store, restore flow и тест на cold restart.

### Разрастание `factory.ts`

Мера: вынести регистрацию TonConnect tools и runtime manager в отдельные helper-функции.

### Конфликт с текущим lifecycle registry mode

Мера: отделить TonConnect runtime от `createWalletService(...).close()` и не смешивать их контракты.

### Неочевидное поведение в multi-session HTTP

Мера: зафиксировать одну серверную runtime-модель на wallet, а не отдельную на каждый HTTP client session.

## Definition of Done

- В `packages/mcp` есть persistent wallet-side TonConnect runtime.
- Через MCP можно подключить dApp по TonConnect URL.
- Входящие `connect`, `sendTransaction` и `signData` запросы появляются как управляемые MCP requests.
- Доступны tools для list/approve/reject/disconnect/status.
- Сессии и pending requests переживают рестарт процесса.
- Поведение в stdio и HTTP mode задокументировано и покрыто тестами.
- Serverless mode явно помечен как unsupported для TonConnect v1.
