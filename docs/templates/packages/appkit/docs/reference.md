---
target: packages/appkit/docs/reference.md
---

## Class

### AppKit

Runtime that wires together connectors, networks, providers and the event
emitter for a TON dApp. Every action in `@ton/appkit` takes an `AppKit`
instance as its first argument.

Construct one at app startup, pass it down through your app (or via
`AppKitProvider` in React), and reuse it for the lifetime of the
application. Tear it down with `dispose()` if you need to recreate it.

Constructor: `new AppKit(config)`

| Parameter | Type | Description |
| --- | --- | --- |
| `config`\* | `AppKitConfig` | Networks, connectors, providers and other startup settings. |

**Example**

%%docs/examples/src/appkit#APPKIT_INIT%%

## Action

### Balances

#### getBalanceByAddress

Read the Toncoin balance of an arbitrary address.

Use this when you need to look up a balance for any wallet, not just the
one currently selected in AppKit. For the selected wallet's balance use
`getBalance`.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | AppKit runtime instance. |
| `options`\* | `GetBalanceByAddressOptions` | Address to query and optional network override. |
| `options.address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `options.network` | `Network \| undefined` | Network to read the balance from. Defaults to the AppKit's selected network. |

Returns: `Promise<string>` — Balance in TON as a human-readable decimal string.

**Example**

%%docs/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS%%

### Signing

#### signText

Ask the connected wallet to sign a plain text message.

Returns the signature plus the canonical payload that was actually signed
— wallets normalize whitespace and encoding, so verify against the
returned payload, not against the original input string.

Throws `Error('Wallet not connected')` if no wallet is currently selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | AppKit runtime instance. |
| `parameters`\* | [`SignTextParameters`](#signtextparameters) | Text to sign and optional network override. |
| `parameters.text`\* | `string` | UTF-8 text the user is asked to sign. |
| `parameters.network` | `Network \| undefined` | Network to issue the sign request against. Defaults to the AppKit's selected network. |

Returns: `Promise<SignDataResponse>` — Signature and signed payload, as returned by the wallet.

**Example**

%%docs/examples/src/appkit/actions/signing#SIGN_TEXT%%

### Transactions

#### transferTon

Send a TON transfer from the selected wallet.

Builds a transfer transaction and sends it through the connected wallet
in one step. If you need to inspect or sign the transaction before
sending, use `createTransferTonTransaction` and `sendTransaction`
separately.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | AppKit runtime instance. |
| `parameters`\* | `CreateTransferTonTransactionParameters` | Recipient, amount and optional payload/comment. |
| `parameters.recipientAddress`\* | `string` | Recipient address |
| `parameters.amount`\* | `string` | Amount in TONs |
| `parameters.comment` | `string \| undefined` | Human-readable text comment (will be converted to payload) |
| `parameters.payload` | `string \| undefined` | Message payload data encoded in Base64 (overrides comment if provided) |
| `parameters.stateInit` | `string \| undefined` | Initial state for deploying a new contract, encoded in Base64 |

Returns: `Promise<SendTransactionResponse>` — Wallet response carrying the BoC of the sent transaction.

**Example**

%%docs/examples/src/appkit/actions/transaction#TRANSFER_TON%%

## Type

### Balances

#### Balance

Wallet balance amount, expressed as a string (alias of `TokenAmount` from
`@ton/walletkit`). The exact units depend on which API produced the value
— balance/jetton-balance actions return human-readable decimal strings
already formatted with the token's decimals; lower-level walletkit APIs
may return raw integer nano amounts.

```ts
type Balance = TokenAmount;
```

### Connectors and wallets

#### Connector

Wallet connector contract.

A connector is the protocol-specific bridge between AppKit and a wallet
(TonConnect, embedded wallet, etc.). Add your connectors via the AppKit
config; AppKit then drives them through this interface.

| Field | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | Stable connector identifier, unique within an AppKit instance. |
| `type`\* | `string` | Protocol type (e.g. `'tonconnect'`). Multiple connectors can share the same type. |
| `metadata`\* | `ConnectorMetadata` | Display metadata (name, icon) shown in connect UIs. |
| `destroy`\* | `() => void` | Release any resources held by the connector. Call on app teardown. |
| `connectWallet`\* | `(network?: Network) => Promise<void>` | Initiate a wallet connection flow on the given network. |
| `disconnectWallet`\* | `() => Promise<void>` | Disconnect the currently connected wallet, if any. |
| `getConnectedWallets`\* | `() => WalletInterface[]` | Wallets currently connected through this connector. |

### Signing

#### SignTextParameters

Parameters accepted by `signText`.

| Field | Type | Description |
| --- | --- | --- |
| `text`\* | `string` | UTF-8 text the user is asked to sign. |
| `network` | `Network \| undefined` | Network to issue the sign request against. Defaults to the AppKit's selected network. |
