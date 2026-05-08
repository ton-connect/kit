<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: docs/templates/packages/appkit/docs/reference.md
-->

## Class

### Core

#### AppKit

Runtime that wires connectors, networks, providers and the event emitter for a TON dApp; construct once at startup and reuse for the app's lifetime.

Constructor: `new AppKit(config)`

| Parameter | Type | Description |
| --- | --- | --- |
| `config`\* | [`AppKitConfig`](#appkitconfig) | Networks, connectors, providers and runtime flags. |
| `config.networks` | `NetworkAdapters \| undefined` | Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. |
| `config.connectors` | `Array<ConnectorInput> \| undefined` | Wallet connectors registered at startup. |
| `config.defaultNetwork` | `Network \| undefined` | Default network connectors (e.g. TonConnect) enforce on new connections; `undefined` to allow any. |
| `config.providers` | `Array<ProviderInput> \| undefined` | Defi/onramp providers registered at startup. |
| `config.ssr` | `boolean \| undefined` | Set to `true` to enable server-side rendering support. |

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

#### EventEmitter

Global event emitter for the TonWalletKit
Allows components to send and receive events throughout the kit.

Constructor: `new EventEmitter()`

### DeFi

#### DefiError

Copyright (c) TonTech.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Constructor: `new DefiError(message, code, details)`

| Parameter | Type | Description |
| --- | --- | --- |
| `message`\* | `string` | _TODO: describe_ |
| `code`\* | `string` | _TODO: describe_ |
| `details` | `unknown` | _TODO: describe_ |

### Swap

#### SwapError

_TODO: describe_

Constructor: `new SwapError(message, code, details)`

| Parameter | Type | Description |
| --- | --- | --- |
| `message`\* | `string` | _TODO: describe_ |
| `code`\* | `string` | _TODO: describe_ |
| `details` | `unknown` | _TODO: describe_ |

#### SwapManager

SwapManager - manages swap providers and delegates swap operations

Allows registration of multiple swap providers and provides a unified API
for swap operations. Providers can be switched dynamically.

Constructor: `new SwapManager(createFactoryContext)`

| Parameter | Type | Description |
| --- | --- | --- |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |

#### SwapProvider

Abstract base class for swap providers

Provides a common interface for implementing swap functionality
across different DEXs and protocols.

Constructor: `new SwapProvider()`

**Example**

```typescript
class MySwapProvider extends SwapProvider {
  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    // Implementation
  }

  async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
    // Implementation
  }
}
```

## Action

### Balances

#### getBalance

Read the Toncoin balance of the currently selected wallet, returning `null` when no wallet is connected (use [`getBalanceByAddress`](#getbalancebyaddress) for an arbitrary address).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options` | [`GetBalanceOptions`](#getbalanceoptions) | Optional network override. |
| `options.network` | `Network \| undefined` | Network to read the balance from. Defaults to the selected wallet's network. |

Returns: `Promise<GetBalanceReturnType>` — Balance in TON as a human-readable decimal string, or `null` when no wallet is selected.

**Example**

```ts
const balance = await getBalance(appKit);
if (balance) {
    console.log('Balance:', balance);
}
```

#### getBalanceByAddress

Read the Toncoin balance of an arbitrary address — useful for wallets that aren't selected in AppKit (use [`getBalance`](#getbalance) for the selected wallet).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetBalanceByAddressOptions`](#getbalancebyaddressoptions) | Target address and optional network. |
| `options.address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `options.network` | `Network \| undefined` | Network to read the balance from. Defaults to the AppKit's selected network. |

Returns: `Promise<string>` — Balance in TON as a human-readable decimal string.

**Example**

```ts
const balanceByAddress = await getBalanceByAddress(appKit, {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
});
console.log('Balance by address:', balanceByAddress);
```

#### watchBalance

Subscribe to Toncoin balance updates for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use [`watchBalanceByAddress`](#watchbalancebyaddress) for a fixed address).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchBalanceOptions`](#watchbalanceoptions) | Update callback and optional network override. |
| `options.network` | `Network \| undefined` | Network to watch on. Defaults to the selected wallet's network. |
| `options.onChange`\* | `(update: BalanceUpdate) => void` | Callback fired on every balance update from the streaming provider. |

Returns: `WatchBalanceReturnType` — Unsubscribe function — call it to stop receiving updates.

**Example**

```ts
const unsubscribe = watchBalance(appKit, {
    onChange: (update) => {
        console.log('Balance updated:', update.balance);
    },
});

// Later: unsubscribe();
```

#### watchBalanceByAddress

Subscribe to Toncoin balance updates for an arbitrary address, useful for monitoring wallets that are not currently selected in AppKit (use [`watchBalance`](#watchbalance) for the selected wallet).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchBalanceByAddressOptions`](#watchbalancebyaddressoptions) | Target address, update callback and optional network override. |
| `options.address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `options.network` | `Network \| undefined` | Network to watch on. Defaults to the AppKit's selected network. |
| `options.onChange`\* | `(update: BalanceUpdate) => void` | Callback fired on every balance update from the streaming provider. |

Returns: `WatchBalanceByAddressReturnType` — Unsubscribe function — call it to stop receiving updates.

**Example**

```ts
const unsubscribe = watchBalanceByAddress(appKit, {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    onChange: (update) => {
        console.log('Balance by address updated:', update.balance);
    },
});

// Later: unsubscribe();
```

### Signing

#### signText

Ask the connected wallet to sign a plain text message; throws `Error('Wallet not connected')` if no wallet is currently selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`SignTextParameters`](#signtextparameters) | Text to sign and optional network override. |
| `parameters.text`\* | `string` | UTF-8 text the user is asked to sign. |
| `parameters.network` | `Network \| undefined` | Network to issue the sign request against. Defaults to the AppKit's selected network. |

Returns: `Promise<SignDataResponse>` — Signature and signed payload, as returned by the wallet.

**Example**

```ts
const result = await signText(appKit, {
    text: 'Hello, TON!',
});

console.log('Signature:', result.signature);
```

### Transactions

#### transferTon

Build and send a TON transfer from the selected wallet in one step (use `createTransferTonTransaction` + `sendTransaction` if you need to inspect the transaction first).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | `CreateTransferTonTransactionParameters` | Recipient, amount and optional payload/comment. |
| `parameters.recipientAddress`\* | `string` | Recipient address |
| `parameters.amount`\* | `string` | Amount in TONs |
| `parameters.comment` | `string \| undefined` | Human-readable text comment (will be converted to payload) |
| `parameters.payload` | `string \| undefined` | Message payload data encoded in Base64 (overrides comment if provided) |
| `parameters.stateInit` | `string \| undefined` | Initial state for deploying a new contract, encoded in Base64 |

Returns: `Promise<SendTransactionResponse>` — Wallet response carrying the BoC of the sent transaction.

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

#### GetBalanceByAddressOptions

Options for [`getBalanceByAddress`](#getbalancebyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `network` | `Network \| undefined` | Network to read the balance from. Defaults to the AppKit's selected network. |

#### GetBalanceOptions

Options for [`getBalance`](#getbalance).

| Field | Type | Description |
| --- | --- | --- |
| `network` | `Network \| undefined` | Network to read the balance from. Defaults to the selected wallet's network. |

#### WatchBalanceByAddressOptions

Options for [`watchBalanceByAddress`](#watchbalancebyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string \| Address` | Wallet address as a base64url string or an `Address` instance. |
| `network` | `Network \| undefined` | Network to watch on. Defaults to the AppKit's selected network. |
| `onChange`\* | `(update: BalanceUpdate) => void` | Callback fired on every balance update from the streaming provider. |

#### WatchBalanceOptions

Options for [`watchBalance`](#watchbalance).

| Field | Type | Description |
| --- | --- | --- |
| `network` | `Network \| undefined` | Network to watch on. Defaults to the selected wallet's network. |
| `onChange`\* | `(update: BalanceUpdate) => void` | Callback fired on every balance update from the streaming provider. |

### Connectors and wallets

#### Connector

Wallet connector contract — the protocol-specific bridge (TonConnect, embedded wallet, …) AppKit drives once you register it via `AppKitConfig.connectors`.

| Field | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | Stable connector identifier, unique within an AppKit instance. |
| `type`\* | `string` | Protocol type (e.g. `'tonconnect'`). Multiple connectors can share the same type. |
| `metadata`\* | `ConnectorMetadata` | Display metadata (name, icon) shown in connect UIs. |
| `destroy`\* | `() => void` | Release any resources held by the connector. Call on app teardown. |
| `connectWallet`\* | `(network?: Network) => Promise<void>` | Initiate a wallet connection flow on the given network. |
| `disconnectWallet`\* | `() => Promise<void>` | Disconnect the currently connected wallet, if any. |
| `getConnectedWallets`\* | `() => WalletInterface[]` | Wallets currently connected through this connector. |

### Core

#### AppKitConfig

Constructor options for [`AppKit`](#appkit) — networks, connectors, providers and runtime flags.

| Field | Type | Description |
| --- | --- | --- |
| `networks` | `NetworkAdapters \| undefined` | Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. |
| `connectors` | `Array<ConnectorInput> \| undefined` | Wallet connectors registered at startup. |
| `defaultNetwork` | `Network \| undefined` | Default network connectors (e.g. TonConnect) enforce on new connections; `undefined` to allow any. |
| `providers` | `Array<ProviderInput> \| undefined` | Defi/onramp providers registered at startup. |
| `ssr` | `boolean \| undefined` | Set to `true` to enable server-side rendering support. |

#### AppKitEmitter

Strongly-typed event emitter exposed as [`AppKit`](#appkit)`.emitter`; `appKit.emitter.on(name, handler)` returns an unsubscribe function.

```ts
type AppKitEmitter = EventEmitter<AppKitEvents>;
```

#### AppKitEvents

Map of every event name AppKit can emit to its payload type, used to type listeners on [`AppKitEmitter`](#appkitemitter).

```ts
type AppKitEvents = {
    // Connector events
    [CONNECTOR_EVENTS.CONNECTED]: WalletConnectedPayload;
    [CONNECTOR_EVENTS.DISCONNECTED]: WalletDisconnectedPayload;

    // Wallets events
    [WALLETS_EVENTS.UPDATED]: { wallets: WalletInterface[] };
    [WALLETS_EVENTS.SELECTION_CHANGED]: { walletId: string | null };

    // Networks events
    [NETWORKS_EVENTS.UPDATED]: Record<string, never>;
    [NETWORKS_EVENTS.DEFAULT_CHANGED]: DefaultNetworkChangedPayload;
} & SharedKitEvents;
```

#### DefaultNetworkChangedPayload

Payload of `networks:default-changed` events — the new default network, or `undefined` when cleared.

| Field | Type | Description |
| --- | --- | --- |
| `network`\* | `Network \| undefined` | _TODO: describe_ |

#### EventListener

_TODO: describe_

```ts
type EventListener = (event: KitEvent<T>) => void | Promise<void>;
```

#### EventPayload

Copyright (c) TonTech.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

```ts
type EventPayload = object;
```

#### KitEvent

_TODO: describe_

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | `string` | _TODO: describe_ |
| `payload`\* | `T` | _TODO: describe_ |
| `source` | `string \| undefined` | _TODO: describe_ |
| `timestamp`\* | `number` | _TODO: describe_ |

#### SharedKitEvents

Events shared between all walletkit and appkit.

```ts
type SharedKitEvents = StreamingEvents & BaseProviderEvents;
```

#### WalletConnectedPayload

Payload of `connector:connected` events — newly connected wallets and the originating connector id.

| Field | Type | Description |
| --- | --- | --- |
| `wallets`\* | `Array<WalletInterface>` | _TODO: describe_ |
| `connectorId`\* | `string` | _TODO: describe_ |

#### WalletDisconnectedPayload

Payload of `connector:disconnected` events — id of the connector whose wallet was just disconnected.

| Field | Type | Description |
| --- | --- | --- |
| `connectorId`\* | `string` | _TODO: describe_ |

### DeFi

#### DefiManagerAPI

Swap API interface exposed by SwapManager

| Field | Type | Description |
| --- | --- | --- |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |
| `registerProvider`\* | `(provider: ProviderInput<T>) => void` | Register a new provider. If a provider with the same id is already registered, it is replaced. |
| `removeProvider`\* | `(provider: T) => void` | Remove a previously registered provider. No-op if the provider was not registered. |
| `setDefaultProvider`\* | `(providerId: string) => void` | Set the default provider |
| `getProvider`\* | `(providerId?: string) => T` | Get a registered provider |
| `getProviders`\* | `() => T[]` | Get all registered providers. The returned array keeps a stable reference until the provider list changes. |
| `hasProvider`\* | `(providerId: string) => boolean` | Check if a provider is registered |

#### DefiProvider

Base interface for all DeFi providers

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | `DefiProviderType` | _TODO: describe_ |
| `getSupportedNetworks`\* | `() => Network[]` | Networks this provider can operate on. Consumers should check before calling provider methods. Implementations may return a static list or compute it dynamically (e.g. from runtime config). |
| `providerId`\* | `string` | _TODO: describe_ |

### Networks

#### ApiClientConfig

API client configuration options

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string \| undefined` | _TODO: describe_ |
| `key` | `string \| undefined` | _TODO: describe_ |

#### Network

TON blockchain network identifier.

| Field | Type | Description |
| --- | --- | --- |
| `chainId`\* | `string` | Chain ID of the network (e.g., "-239" for mainnet, "-3" for testnet) |

#### NetworkAdapters

Multi-network configuration keyed by chain ID
Example: \{ [Networl.mainnet().chainId]: \{ apiClient: \{...\} \}, [Networl.testnet().chainId]: \{ apiClient: \{...\} \} \}

```ts
type NetworkAdapters = {
    [key: string]: NetworkConfig | undefined;
};
```

#### NetworkConfig

Network configuration for a specific chain

| Field | Type | Description |
| --- | --- | --- |
| `apiClient` | `ApiClientConfig \| ApiClient \| undefined` | API client configuration or instance |

### Signing

#### SignTextParameters

Parameters accepted by `signText`.

| Field | Type | Description |
| --- | --- | --- |
| `text`\* | `string` | UTF-8 text the user is asked to sign. |
| `network` | `Network \| undefined` | Network to issue the sign request against. Defaults to the AppKit's selected network. |

### Swap

#### SwapAPI

Swap API interface exposed by SwapManager

| Field | Type | Description |
| --- | --- | --- |
| `getQuote`\* | `(params: SwapQuoteParams, providerId?: string) => Promise<SwapQuote>` | Get a quote for swapping tokens |
| `buildSwapTransaction`\* | `(params: SwapParams) => Promise<TransactionRequest>` | Build a transaction for a swap. Provider is taken from `params.quote.providerId`, or the manager default. |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |
| `registerProvider`\* | `(provider: ProviderInput<SwapProviderInterface<unknown, unknown>>) => void` | Register a new provider. If a provider with the same id is already registered, it is replaced. |
| `removeProvider`\* | `(provider: SwapProviderInterface<unknown, unknown>) => void` | Remove a previously registered provider. No-op if the provider was not registered. |
| `setDefaultProvider`\* | `(providerId: string) => void` | Set the default provider |
| `getProvider`\* | `(providerId?: string) => SwapProviderInterface<unknown, unknown>` | Get a registered provider |
| `getProviders`\* | `() => Array<SwapProviderInterface<unknown, unknown>>` | Get all registered providers. The returned array keeps a stable reference until the provider list changes. |
| `hasProvider`\* | `(providerId: string) => boolean` | Check if a provider is registered |

#### SwapParams

Parameters for building swap transaction

| Field | Type | Description |
| --- | --- | --- |
| `quote`\* | `SwapQuote` | The swap quote based on which the transaction is built |
| `userAddress`\* | `string` | Address of the user performing the swap |
| `destinationAddress` | `string \| undefined` | Address to receive the swapped tokens (defaults to userAddress) |
| `slippageBps` | `number \| undefined` | Slippage tolerance in basis points (1 bp = 0.01%) |
| `deadline` | `number \| undefined` | Transaction deadline in unix timestamp |
| `providerOptions` | `TProviderOptions \| undefined` | Provider-specific options |

#### SwapQuote

Swap quote response with pricing information

| Field | Type | Description |
| --- | --- | --- |
| `fromToken`\* | `SwapToken` | Token being sold |
| `toToken`\* | `SwapToken` | Token being bought |
| `rawFromAmount`\* | `string` | Amount of tokens to sell |
| `rawToAmount`\* | `string` | Amount of tokens to buy |
| `fromAmount`\* | `string` | Amount of tokens to sell |
| `toAmount`\* | `string` | Amount of tokens to buy |
| `rawMinReceived`\* | `string` | Minimum amount of tokens to receive (after slippage) |
| `minReceived`\* | `string` | Minimum amount of tokens to receive (after slippage) |
| `network`\* | `Network` | Network on which the swap will be executed |
| `priceImpact` | `number \| undefined` | Price impact of the swap in basis points (100 = 1%) |
| `providerId`\* | `string` | Identifier of the swap provider |
| `expiresAt` | `number \| undefined` | Unix timestamp in seconds when the quote expires |
| `metadata` | `unknown` | Provider-specific metadata for the quote |

#### SwapQuoteParams

Base parameters for requesting a swap quote

| Field | Type | Description |
| --- | --- | --- |
| `amount`\* | `string` | Amount of tokens to swap (incoming or outgoing depending on isReverseSwap) |
| `from`\* | `SwapToken` | Token to swap from |
| `to`\* | `SwapToken` | Token to swap to |
| `network`\* | `Network` | Network on which the swap will be executed |
| `slippageBps` | `number \| undefined` | Slippage tolerance in basis points (1 bp = 0.01%) |
| `maxOutgoingMessages` | `number \| undefined` | Maximum number of outgoing messages |
| `providerOptions` | `TProviderOptions \| undefined` | Provider-specific options |
| `isReverseSwap` | `boolean \| undefined` | If true, amount is the amount to receive (buy). If false, amount is the amount to spend (sell). |

#### SwapToken

Token type for swap

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string` | _TODO: describe_ |
| `decimals`\* | `number` | _TODO: describe_ |
| `name` | `string \| undefined` | _TODO: describe_ |
| `symbol` | `string \| undefined` | _TODO: describe_ |
| `image` | `string \| undefined` | _TODO: describe_ |
| `chainId` | `string \| undefined` | _TODO: describe_ |

#### TokenAmount

Token amount represented as a string to preserve precision.
For TON, this is typically in nanotons (1 TON = 10^9 nanotons).

```ts
type TokenAmount = string;
```

## Constants

### Connector

#### CONNECTOR_EVENTS

Event names AppKit emits on wallet connection and disconnection; payloads are [`WalletConnectedPayload`](#walletconnectedpayload) and [`WalletDisconnectedPayload`](#walletdisconnectedpayload).

```ts
const CONNECTOR_EVENTS = {
    CONNECTED: 'connector:connected',
    DISCONNECTED: 'connector:disconnected',
} as const;
```

### Networks

#### NETWORKS_EVENTS

Event names AppKit emits on network changes; `DEFAULT_CHANGED` carries a [`DefaultNetworkChangedPayload`](#defaultnetworkchangedpayload).

```ts
const NETWORKS_EVENTS = {
    UPDATED: 'networks:updated',
    DEFAULT_CHANGED: 'networks:default-changed',
} as const;
```

### Wallets

#### WALLETS_EVENTS

Event names AppKit emits when the available wallet list (`UPDATED`) or the active wallet (`SELECTION_CHANGED`) changes.

```ts
const WALLETS_EVENTS = {
    UPDATED: 'wallets:updated',
    SELECTION_CHANGED: 'wallets:selection-changed',
} as const;
```
