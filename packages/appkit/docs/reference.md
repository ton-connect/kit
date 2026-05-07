<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: docs/templates/packages/appkit/docs/reference.md
-->

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

```ts
// Initialize AppKit
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
        // Optional: add testnet
        // [Network.testnet().chainId]: {
        //     apiClient: {
        //         url: 'https://testnet.toncenter.com',
        //         key: 'your-key',
        //     },
        // },
    },
    connectors: [
        createTonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
});
```

## Action

### Balances

#### getBalanceByAddress

Read the Toncoin balance of an arbitrary address.

Use this when you need to look up a balance for any wallet, not just the
one currently selected in AppKit. For the selected wallet's balance use
`getBalance`.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | `AppKit` | AppKit runtime instance. |
| `options`\* | `GetBalanceByAddressOptions` | Address to query and optional network override. |
| `options.address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `options.network` | `Network \| undefined` | Network to read the balance from. Defaults to the AppKit's selected network. |

Returns: Balance amount as a `TokenAmount` (string nanos with token metadata).

**Example**

```ts
const balanceByAddress = await getBalanceByAddress(appKit, {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
});
console.log('Balance by address:', balanceByAddress.toString());
```

### Signing

#### signText

Ask the connected wallet to sign a plain text message.

Returns the signature plus the canonical payload that was actually signed
— wallets normalize whitespace and encoding, so verify against the
returned payload, not against the original input string.

Throws `Error('Wallet not connected')` if no wallet is currently selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | `AppKit` | AppKit runtime instance. |
| `parameters`\* | `SignTextParameters` | Text to sign and optional network override. |
| `parameters.text`\* | `string` | UTF-8 text the user is asked to sign. |
| `parameters.network` | `Network \| undefined` | Network to issue the sign request against. Defaults to the AppKit's selected network. |

Returns: Signature and signed payload, as returned by the wallet.

**Example**

```ts
const result = await signText(appKit, {
    text: 'Hello, TON!',
});

console.log('Signature:', result.signature);
```

### Transactions

#### transferTon

Send a TON transfer from the selected wallet.

Builds a transfer transaction and sends it through the connected wallet
in one step. If you need to inspect or sign the transaction before
sending, use `createTransferTonTransaction` and `sendTransaction`
separately.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | `AppKit` | AppKit runtime instance. |
| `parameters`\* | `CreateTransferTonTransactionParameters` | Recipient, amount and optional payload/comment. |
| `parameters.recipientAddress`\* | `string` | Recipient address |
| `parameters.amount`\* | `string` | Amount in TONs |
| `parameters.comment` | `string \| undefined` | Human-readable text comment (will be converted to payload) |
| `parameters.payload` | `string \| undefined` | Message payload data encoded in Base64 (overrides comment if provided) |
| `parameters.stateInit` | `string \| undefined` | Initial state for deploying a new contract, encoded in Base64 |

Returns: Wallet response carrying the BoC of the sent transaction.

**Example**

```ts
const result = await transferTon(appKit, {
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '0.1', // 0.1 TON (human-readable format)
    comment: 'Hello from AppKit!',
});

console.log('Transfer Result:', result);
```

## Type

### Balances

#### Balance

Wallet balance for a single token.

Re-exported from `@ton/walletkit` as `TokenAmount`. Carries the raw integer
amount (in the token's smallest units, e.g. nanotons) together with token
metadata (decimals, symbol, etc.) so consumers can format it without
looking up the token separately.

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
