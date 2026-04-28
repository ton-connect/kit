# TonAPI vs Toncenter — расхождения в EmulationResponse

Сравнение вывода `fetchEmulation` между `ApiClientTonApi` и `ApiClientToncenter`
для трёх типов транзакций: TON transfer, Jetton transfer (USDT), NFT transfer.
Все тесты используют один и тот же отправитель (`EQA3H_...nlFT`, WalletV5R1).

---

## Сводка по типам транзакций

| Область | TON transfer | Jetton transfer | NFT transfer |
|---|---|---|---|
| Money flow | ✓ совпадает | ✓ совпадает | ✓ совпадает |
| Тип действия | ✓ `ton_transfer` | ✓ `jetton_transfer` | ✗ `NftItemTransfer` vs `nft_transfer` |
| Детали действия | ✓ совпадает | ~ частичное совпадение | ✗ разная схема |

---

## Money flow

**Совпадает во всех трёх типах.**

TON transfer — оба клиента:
```json
{
  "outputs": "100000000",
  "inputs": "0",
  "allJettonTransfers": [],
  "ourTransfers": [{ "assetType": "ton", "amount": "-100000000" }],
  "ourAddress": "EQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723nlFT"
}
```

Jetton transfer — оба клиента:
```json
{
  "outputs": "50000000",
  "inputs": "47032172",
  "allJettonTransfers": [{
    "assetType": "jetton",
    "tokenAddress": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    "fromAddress": "EQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723nlFT",
    "toAddress": "EQCHK0FEaVC434Tv5cCrRkN4_1XPD-ya8WPrUstIxy6AdyA0",
    "amount": "1000000"
  }],
  "ourTransfers": [
    { "assetType": "ton", "amount": "-2967828" },
    { "assetType": "jetton", "tokenAddress": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", "amount": "-1000000" }
  ],
  "ourAddress": "EQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723nlFT"
}
```

NFT transfer — оба клиента:
```json
{
  "outputs": "100000000",
  "inputs": "93576387",
  "allJettonTransfers": [],
  "ourTransfers": [{ "assetType": "ton", "amount": "-6423613" }],
  "ourAddress": "EQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723nlFT"
}
```

---

## Верхнеуровневые поля

TonAPI не возвращает `mcBlockSeqno`, `randSeed`, `codeCells`, `dataCells`, `addressBook`.

Пример (TON transfer):
```
Toncenter: mcBlockSeqno=63259736, randSeed=0x5f3d16..., codeCells={1 запись}, dataCells={3 записи}, addressBook={2 записи}
TonAPI:    mcBlockSeqno=0,        randSeed=0x000...,   codeCells={},          dataCells={},          addressBook={}
```

---

## Действия (Actions)

### Детали действий фундаментально различаются между API

TonAPI и Toncenter используют разные схемы для деталей действий, и это различие принципиальное —
его нельзя полностью устранить простым переименованием полей.

Toncenter получает детали действий путём парсинга сырых сообщений транзакций (опкоды, тела ячеек),
что даёт доступ к каждому полю оригинального сообщения: `query_id`, `response_destination`,
`forward_amount`, `custom_payload`, адрес коллекции, индекс предмета и т.д.

TonAPI вычисляет детали действий на сервере из собственных индексированных данных и возвращает
только кураторский набор полей для каждого типа действия. Имена полей также отличаются
(PascalCase-типы, вложенные объекты адресов `{ address, is_scam, is_wallet }` вместо простых строк).

В `mapAction` мы нормализуем наиболее распространённые типы (имя типа → snake_case, разворачивание
объектов адресов, переименование полей под схему Toncenter), но покрытие частичное и best-effort:

| Тип действия (Toncenter) | Тип TonAPI | Нормализован | Примечание |
|---|---|---|---|
| `ton_transfer` | `TonTransfer` | ✓ | Поля совпадают после нормализации |
| `jetton_transfer` | `JettonTransfer` | ✓ | `response_destination` и `forward_amount` отсутствуют в TonAPI |
| `jetton_swap` | `JettonSwap` | ✓ | Частично — детали peer swap недоступны |
| `nft_transfer` | `NftItemTransfer` | ✗ | Ещё не маппится; коллекция, индекс, response_destination недоступны |
| все остальные типы | разные | ✗ | Передаются как есть с сырым payload TonAPI |

Даже для нормализованных типов ряд полей просто отсутствует в ответе TonAPI и не может быть
восстановлен без дополнительных запросов к API: `query_id`, `custom_payload`, `forward_payload`,
`response_destination`, адрес коллекции NFT, индекс NFT.

### Пример: `ton_transfer` (после нормализации)

Toncenter:
```json
{
  "type": "ton_transfer",
  "details": {
    "source": "0:371FFBA062655984BDE15686E73004524D4C0814A7C67B2ACDE50D2A23BDB79E",
    "destination": "0:872B41446950B8DF84EFE5C0AB464378FF55CF0FEC9AF163EB52CB48C72E8077",
    "value": "100000000",
    "value_extra_currencies": null,
    "comment": "hello",
    "encrypted": false
  }
}
```

TonAPI (после нормализации):
```json
{
  "type": "ton_transfer",
  "details": {
    "source": "0:371ffba062655984bde15686e73004524d4c0814a7c67b2acde50d2a23bdb79e",
    "destination": "0:872b41446950b8df84efe5c0ab464378ff55cf0fec9af163eb52cb48c72e8077",
    "value": "100000000",
    "value_extra_currencies": {},
    "comment": "hello",
    "encrypted": false
  }
}
```

Различия: регистр адресов (`0:371F...` vs `0:371f...`), `value_extra_currencies` (`null` vs `{}`).

### Пример: `jetton_transfer` (после нормализации)

Toncenter:
```json
{
  "type": "jetton_transfer",
  "details": {
    "asset": "0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE",
    "sender": "0:371FFBA062655984BDE15686E73004524D4C0814A7C67B2ACDE50D2A23BDB79E",
    "receiver": "0:872B41446950B8DF84EFE5C0AB464378FF55CF0FEC9AF163EB52CB48C72E8077",
    "sender_jetton_wallet": "0:699EFCE517132B2319F53EE3B25F8723F25FA2A4101E4A676FA222CBFF8901D6",
    "receiver_jetton_wallet": "0:E2180193F269CAC054628C571E06199690EB71D3090389CFAE58640B07DEE4BA",
    "amount": "1000000",
    "comment": null,
    "is_encrypted_comment": false,
    "query_id": "0",
    "response_destination": "0:371FFBA062655984BDE15686E73004524D4C0814A7C67B2ACDE50D2A23BDB79E",
    "custom_payload": null,
    "forward_payload": null,
    "forward_amount": "1"
  }
}
```

TonAPI (после нормализации):
```json
{
  "type": "jetton_transfer",
  "details": {
    "asset": "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe",
    "sender": "0:371ffba062655984bde15686e73004524d4c0814a7c67b2acde50d2a23bdb79e",
    "receiver": "0:872b41446950b8df84efe5c0ab464378ff55cf0fec9af163eb52cb48c72e8077",
    "sender_jetton_wallet": "0:699efce517132b2319f53ee3b25f8723f25fa2a4101e4a676fa222cbff8901d6",
    "receiver_jetton_wallet": "0:e2180193f269cac054628c571e06199690eb71d3090389cfae58640b07dee4ba",
    "amount": "1000000",
    "comment": null,
    "is_encrypted_comment": false,
    "query_id": "0",
    "response_destination": null,
    "custom_payload": null,
    "forward_payload": null,
    "forward_amount": "0"
  }
}
```

Различия: регистр адресов, `response_destination` (`"0:371f..."` vs `null`), `forward_amount` (`"1"` vs `"0"`).

### Пример: `nft_transfer` (ещё не нормализован)

Toncenter:
```json
{
  "type": "nft_transfer",
  "details": {
    "nft_collection": "0:368252836EF7B3474299B2D02A3661CB12990E1C8775458006C336B4E972C238",
    "nft_item": "0:13CAB57A49630BC5EB2DE47842951883D237405350F206DC3D131DE96F7F1D09",
    "nft_item_index": "316525090045952",
    "old_owner": "0:371FFBA062655984BDE15686E73004524D4C0814A7C67B2ACDE50D2A23BDB79E",
    "new_owner": "0:872B41446950B8DF84EFE5C0AB464378FF55CF0FEC9AF163EB52CB48C72E8077",
    "is_purchase": false,
    "query_id": "0",
    "response_destination": "0:371FFBA062655984BDE15686E73004524D4C0814A7C67B2ACDE50D2A23BDB79E",
    "custom_payload": null,
    "forward_payload": "te6cckEBAQEAAgAAAEysuc0=",
    "forward_amount": "1",
    "comment": null,
    "is_encrypted_comment": false,
    "marketplace": null
  }
}
```

TonAPI (сырой, без нормализации):
```json
{
  "type": "NftItemTransfer",
  "details": {
    "sender": { "address": "0:371ffba...", "is_scam": false, "is_wallet": true },
    "recipient": { "address": "0:872b41...", "is_scam": false, "is_wallet": true },
    "nft": "0:13cab57a49630bc5eb2de47842951883d237405350f206dc3d131de96f7f1d09"
  }
}
```

TonAPI не предоставляет `nft_collection`, `nft_item_index`, `response_destination`, `forward_amount`, `query_id`.

### Отсутствующие поля во всех типах действий

TonAPI не возвращает диапазоны времени для отдельных действий — только `lt` и `timestamp` на уровне события:

```
Toncenter: startLt="73409778000001", endLt="73409778000007", traceEndLt="73409778000007",
           traceEndUtime=1777358198, traceMcSeqnoEnd=63259934
TonAPI:    startLt="72171097000026", endLt="72171097000026", traceEndLt="0",
           traceEndUtime=0, traceMcSeqnoEnd=0
```

---

## Транзакции

### Поля, недоступные в TonAPI

`prevTransHash` и `prevTransLt` — TonAPI их не возвращает:
```
Toncenter: prevTransHash="0x55feda072d2c4744...", prevTransLt="72171097000026"
TonAPI:    prevTransHash=null, prevTransLt=null
```

`blockRef` — поле `block` в ответе TonAPI не заполняется при эмуляции:
```
Toncenter: { workchain: 0, shard: "8000000000000000", seqno: 68164165 }
TonAPI:    { workchain: 0, shard: "0", seqno: 0 }
```

`accountStateBefore` / `accountStateAfter` — TonAPI не возвращает снимки состояния аккаунта:
```json
// Toncenter
{
  "hash": "0x8b59cce7b2b625b61648dbc165904272b24e5c8f08b7ff001c05a712179d48be",
  "balance": "24420800111",
  "accountStatus": "active",
  "dataHash": "0x553b325331d7efbd5b4d0ea62ef2bbb8aa35617ea773a44024ad76fa34354700",
  "codeHash": "0x20834b7b72b112147e1b2fb457b84e74d1a30f04f737d4f62a668e9552d2b72f"
}
// TonAPI
{
  "hash": "",
  "balance": "0",
  "accountStatus": "active",
  "dataHash": null,
  "codeHash": null
}
```

`outMsgs` — TonAPI возвращает исходящие сообщения только для корневой транзакции; у всех дочерних транзакций `[]`:
```
Toncenter корневая tx outMsgs: [{ hash: "0x1a7b4a...", destination: "EQCHK0...", value: "100000000", ... }]
TonAPI    корневая tx outMsgs: []
```

### Поля, которые отличаются при каждом запуске эмуляции

Меняются каждый раз, так как каждый запрос эмулируется относительно текущего состояния блокчейна:

| Поле | Пример Toncenter | Пример TonAPI |
|---|---|---|
| `hash` | `"0xd687021c..."` | `"0xe3899c6a..."` |
| `lt` | `"73409579000000"` | `"72171097000026"` |
| `now` | `1777358119` | `1777358120` |
| `mcBlockSeqno` | `63259736` | `0` |
| `totalFees` | `"2960847"` | `"2960848"` |
| `traceExternalHash` | `"0xbcc38e3d..."` | `"0xe3899c6a..."` |

### Небольшие структурные различия в `description`

`isCreditFirst` — TonAPI всегда возвращает `false`:
```
Toncenter: isCreditFirst=true   (когда применимо)
TonAPI:    isCreditFirst=false  (всегда)
```

`computePhase.gasLimit` — TonAPI устанавливает равным `gasUsed` вместо реального лимита:
```
Toncenter: gasUsed="4939", gasLimit="0", gasCredit="10000"  (используется gas credit, лимита нет)
TonAPI:    gasUsed="4939", gasLimit="4939"                  (лимит = использовано, поля gasCredit нет)
```

Хэши состояния VM и `actionListHash` — отсутствуют в TonAPI:
```
Toncenter: vmInitStateHash="0x000...", vmFinalStateHash="0x000...", actionListHash="0x5b5b..."
TonAPI:    (эти поля отсутствуют)
```
