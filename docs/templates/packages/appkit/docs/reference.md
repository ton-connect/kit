---
target: packages/appkit/docs/reference.md
---

## Class

### Core

#### AppKit

Runtime that wires connectors, networks, providers and the event emitter for a TON dApp; construct once at startup and reuse for the app's lifetime.

Constructor: `new AppKit(config)`

| Parameter | Type | Description |
| --- | --- | --- |
| `config`\* | [`AppKitConfig`](#appkitconfig) | Networks, connectors, providers and runtime flags. |
| `config.networks` | <a href="#networkadapters"><code>NetworkAdapters</code></a> | Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. |
| `config.connectors` | <a href="#connectorinput"><code>ConnectorInput</code></a><code>[]</code> | Wallet connectors registered at startup. |
| `config.defaultNetwork` | <a href="#network"><code>Network</code></a> | Default network connectors (e.g. TonConnect) enforce on new connections; `undefined` to allow any. |
| `config.providers` | <a href="#providerinput"><code>ProviderInput</code></a><code>[]</code> | Defi/onramp providers registered at startup. |
| `config.ssr` | `boolean` | Set to `true` to enable server-side rendering support. |

**Example**

%%docs/examples/src/appkit#APPKIT_INIT%%

#### EventEmitter

Global event emitter for the TonWalletKit
Allows components to send and receive events throughout the kit.

Constructor: `new EventEmitter()`

### Crypto Onramp

#### CryptoOnrampError

Error thrown by [`CryptoOnrampManager`](#cryptoonrampmanager) and crypto-onramp providers — extends [`DefiError`](#defierror) with a `'crypto-onramp'` discriminator.

Constructor: `new CryptoOnrampError(message, code, details)`

| Parameter | Type | Description |
| --- | --- | --- |
| `message`\* | `string` | _TODO: describe_ |
| `code`\* | `string` | _TODO: describe_ |
| `details` | `unknown` | _TODO: describe_ |

#### CryptoOnrampManager

CryptoOnrampManager — manages crypto onramp providers and delegates crypto onramp operations.

Allows registration of multiple crypto onramp providers and provides a unified API
for crypto-to-TON onramp operations. Providers can be switched dynamically.

Constructor: `new CryptoOnrampManager()`

#### CryptoOnrampProvider

Abstract base class for crypto onramp providers

Provides a common interface for implementing crypto-to-TON onramp functionality
across different gateways.

Constructor: `new CryptoOnrampProvider()`

**Example**

```typescript
class MyCryptoOnrampProvider extends CryptoOnrampProvider {
  async getQuote(params: CryptoOnrampQuoteParams): Promise<CryptoOnrampQuote> {
    // Implementation
  }

  async createDeposit(params: CryptoOnrampDepositParams): Promise<CryptoOnrampDeposit> {
    // Implementation
  }
}
```

### DeFi

#### DefiError

Base error thrown by DeFi managers (swap, staking, onramp) when a provider call fails; subclassed by [`SwapError`](#swaperror) / [`StakingError`](#stakingerror) and discriminated at runtime via the `code` field.

Constructor: `new DefiError(message, code, details)`

| Parameter | Type | Description |
| --- | --- | --- |
| `message`\* | `string` | Human-readable description, forwarded to `Error`. |
| `code`\* | `string` | Stable error code from the `DefiError.*` constants. |
| `details` | `unknown` | Optional provider-specific context for diagnostics. |

### Networks

#### AppKitNetworkManager

Network manager exposed as [`AppKit`](#appkit)`.networkManager` — extends walletkit's `KitNetworkManager` with a default-network setter and AppKit event emission.

Constructor: `new AppKitNetworkManager(options, emitter)`

| Parameter | Type | Description |
| --- | --- | --- |
| `options`\* | <code>ConstructorParameters&lt;typeof </code><a href="#kitnetworkmanager"><code>KitNetworkManager</code></a><code>&gt;[0]</code> | _TODO: describe_ |
| `emitter`\* | <a href="#appkitemitter"><code>AppKitEmitter</code></a> | _TODO: describe_ |

#### KitNetworkManager

Walletkit-side network manager — the base class [`AppKitNetworkManager`](#appkitnetworkmanager) extends with default-network state and AppKit event emission. Apps usually interact with the [`AppKitNetworkManager`](#appkitnetworkmanager) subclass via [`AppKit`](#appkit)`.networkManager`.

Constructor: `new KitNetworkManager(options)`

| Parameter | Type | Description |
| --- | --- | --- |
| `options`\* | <a href="#tonwalletkitoptions"><code>TonWalletKitOptions</code></a> | _TODO: describe_ |

### Staking

#### StakingError

_TODO: describe_

Constructor: `new StakingError(message, code, details)`

| Parameter | Type | Description |
| --- | --- | --- |
| `message`\* | `string` | _TODO: describe_ |
| `code`\* | <a href="#stakingerrorcode"><code>StakingErrorCode</code></a> | _TODO: describe_ |
| `details` | `unknown` | _TODO: describe_ |

#### StakingManager

StakingManager - manages staking providers and delegates staking operations

Allows registration of multiple staking providers and provides a unified API
for staking operations. Providers can be switched dynamically.

Constructor: `new StakingManager(createFactoryContext)`

| Parameter | Type | Description |
| --- | --- | --- |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |

#### StakingProvider

Abstract base class for staking providers

Provides common utilities and enforces implementation of core staking methods.
Users can extend this class to create custom staking providers.

Constructor: `new StakingProvider(providerId)`

| Parameter | Type | Description |
| --- | --- | --- |
| `providerId`\* | `string` | _TODO: describe_ |

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
| `options.network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the selected wallet's network. |

Returns: <code>Promise&lt;</code><a href="#getbalancereturntype"><code>GetBalanceReturnType</code></a><code>&gt;</code> — Balance in TON as a human-readable decimal string, or `null` when no wallet is selected.

**Example**

%%docs/examples/src/appkit/actions/balances#GET_BALANCE%%

#### getBalanceByAddress

Read the Toncoin balance of an arbitrary address — useful for wallets that aren't selected in AppKit (use [`getBalance`](#getbalance) for the selected wallet).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetBalanceByAddressOptions`](#getbalancebyaddressoptions) | Target address and optional network. |
| `options.address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Wallet address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

Returns: <code>Promise&lt;</code><a href="#getbalancebyaddressreturntype"><code>GetBalanceByAddressReturnType</code></a><code>&gt;</code> — Balance in TON as a human-readable decimal string.

**Example**

%%docs/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS%%

#### watchBalance

Subscribe to Toncoin balance updates for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use [`watchBalanceByAddress`](#watchbalancebyaddress) for a fixed address).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchBalanceOptions`](#watchbalanceoptions) | Update callback and optional network override. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the selected wallet's network. |
| `options.onChange`\* | <code>(update: </code><a href="#balanceupdate"><code>BalanceUpdate</code></a><code>) =&gt; void</code> | Callback fired on every balance update from the streaming provider. |

Returns: <a href="#watchbalancereturntype"><code>WatchBalanceReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

**Example**

%%docs/examples/src/appkit/actions/balances#WATCH_BALANCE%%

#### watchBalanceByAddress

Subscribe to Toncoin balance updates for an arbitrary address, useful for monitoring wallets that are not currently selected in AppKit (use [`watchBalance`](#watchbalance) for the selected wallet).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchBalanceByAddressOptions`](#watchbalancebyaddressoptions) | Target address, update callback and optional network override. |
| `options.address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Wallet address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |
| `options.onChange`\* | <code>(update: </code><a href="#balanceupdate"><code>BalanceUpdate</code></a><code>) =&gt; void</code> | Callback fired on every balance update from the streaming provider. |

Returns: <a href="#watchbalancebyaddressreturntype"><code>WatchBalanceByAddressReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

**Example**

%%docs/examples/src/appkit/actions/balances#WATCH_BALANCE_BY_ADDRESS%%

### Connectors

#### addConnector

Register a wallet connector at runtime — equivalent to passing it via [`AppKitConfig`](#appkitconfig)`.connectors` at construction, but available after AppKit is up.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `connectorFn`\* | [`AddConnectorParameters`](#addconnectorparameters) | Connector instance or factory to register. |

Returns: <a href="#addconnectorreturntype"><code>AddConnectorReturnType</code></a> — Function that unregisters the connector when called.

**Example**

%%docs/examples/src/appkit/actions/connectors#ADD_CONNECTOR%%

#### connect

Trigger the connection flow on a registered connector by id; throws when no connector with that id exists.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`ConnectParameters`](#connectparameters) | Connector to connect through. |
| `parameters.connectorId`\* | `string` | Id of the registered connector to drive the connection through (e.g., `'tonconnect'`). |

Returns: <code>Promise&lt;</code><a href="#connectreturntype"><code>ConnectReturnType</code></a><code>&gt;</code> — Resolves once the connector finishes its handshake — the wallet is then available via [`getSelectedWallet`](#getselectedwallet).

**Example**

%%docs/examples/src/appkit/actions/connectors#CONNECT%%

#### createConnector

Identity helper for typing a [`ConnectorFactory`](#connectorfactory) inline — returns the factory unchanged so authors get parameter inference without spelling the type out.

| Parameter | Type | Description |
| --- | --- | --- |
| `factory`\* | [`ConnectorFactory`](#connectorfactory) | Factory to wrap. |

Returns: <a href="#connectorfactory"><code>ConnectorFactory</code></a> — The same factory, typed as [`ConnectorFactory`](#connectorfactory).

#### disconnect

Disconnect the wallet currently connected through a registered connector; throws when no connector with that id exists.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`DisconnectParameters`](#disconnectparameters) | Connector to disconnect. |
| `parameters.connectorId`\* | `string` | Id of the registered connector whose wallet should be disconnected. |

Returns: <code>Promise&lt;</code><a href="#disconnectreturntype"><code>DisconnectReturnType</code></a><code>&gt;</code> — Resolves once the connector tears down its session.

**Example**

%%docs/examples/src/appkit/actions/connectors#DISCONNECT%%

#### getConnectorById

Look up a registered connector by its id.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetConnectorByIdOptions`](#getconnectorbyidoptions) | Id of the connector to find. |
| `options.id`\* | `string` | Id of the connector to look up. |

Returns: <a href="#getconnectorbyidreturntype"><code>GetConnectorByIdReturnType</code></a> — The matching [`Connector`](#connector), or `undefined` if none with that id is registered.

**Example**

%%docs/examples/src/appkit/actions/connectors#GET_CONNECTOR_BY_ID%%

#### getConnectors

List every connector registered on this AppKit instance — both those passed via [`AppKitConfig`](#appkitconfig)`.connectors` and those added later through [`addConnector`](#addconnector).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |

Returns: <a href="#getconnectorsreturntype"><code>GetConnectorsReturnType</code></a> — Read-only array of registered [`Connector`](#connector)s.

**Example**

%%docs/examples/src/appkit/actions/connectors#GET_CONNECTORS%%

#### watchConnectorById

Subscribe to a connector by id; the callback fires after every wallet-connection event so the caller can re-read connector state (e.g., [`Connector`](#connector)`.getConnectedWallets()`).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`WatchConnectorByIdParameters`](#watchconnectorbyidparameters) | Connector id and update callback. |
| `parameters.id`\* | `string` | Id of the connector to watch. |
| `parameters.onChange`\* | <code>(connector: </code><a href="#connector"><code>Connector</code></a><code> \| undefined) =&gt; void</code> | Callback fired after each wallet-connection event with the current connector (or `undefined` when none is registered under this id). |

Returns: <a href="#watchconnectorbyidreturntype"><code>WatchConnectorByIdReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

**Example**

%%docs/examples/src/appkit/actions/connectors#WATCH_CONNECTOR_BY_ID%%

#### watchConnectors

Subscribe to the list of registered connectors; the callback fires after every wallet-connection event so the caller can re-read state derived from connectors (e.g., connected wallets).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`WatchConnectorsParameters`](#watchconnectorsparameters) | Update callback. |
| `parameters.onChange`\* | <code>(connectors: readonly </code><a href="#connector"><code>Connector</code></a><code>[]) =&gt; void</code> | Callback fired after each wallet-connection event with the current list of registered connectors. |

Returns: <a href="#watchconnectorsreturntype"><code>WatchConnectorsReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

**Example**

%%docs/examples/src/appkit/actions/connectors#WATCH_CONNECTORS%%

### Crypto Onramp

#### createCryptoOnrampDeposit

Create a crypto-onramp deposit from a quote previously obtained via [`getCryptoOnrampQuote`](#getcryptoonrampquote) — the returned [`CryptoOnrampDeposit`](#cryptoonrampdeposit) carries the address and amount the user must send on the source chain.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`CreateCryptoOnrampDepositOptions`](#createcryptoonrampdepositoptions) | Quote, refund address, and optional provider override. |
| `options.quote`\* | <a href="#cryptoonrampquote"><code>CryptoOnrampQuote</code></a><code>&lt;TQuoteMetadata&gt;</code> | Quote to execute the deposit against (contains recipientAddress and provider metadata) |
| `options.refundAddress`\* | `string` | Address to refund the crypto to in case of failure |
| `options.providerOptions` | `TProviderOptions` | Provider-specific options |
| `options.providerId` | `string` | Provider to create the deposit through; defaults to `quote.providerId`, then to the default provider. |

Returns: <a href="#createcryptoonrampdepositreturntype"><code>CreateCryptoOnrampDepositReturnType</code></a> — Deposit details the UI should show to the user (address, amount, expiry).

#### getCryptoOnrampProvider

Get a registered crypto-onramp provider by id, or the default provider when no id is given; throws when the id does not match any registered provider.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options` | [`GetCryptoOnrampProviderOptions`](#getcryptoonrampprovideroptions) | Optional provider id. |
| `options.id` | `string` | Provider id to look up; when omitted, returns the registered default provider. |

Returns: <a href="#getcryptoonrampproviderreturntype"><code>GetCryptoOnrampProviderReturnType</code></a> — The matching [`CryptoOnrampProviderInterface`](#cryptoonrampproviderinterface).

**Example**

%%docs/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDER%%

#### getCryptoOnrampProviders

List every crypto-onramp provider registered on this AppKit instance — both those passed via [`AppKitConfig`](#appkitconfig)`.providers` and those added later through [`registerProvider`](#registerprovider).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |

Returns: <a href="#getcryptoonrampprovidersreturntype"><code>GetCryptoOnrampProvidersReturnType</code></a> — Array of registered [`CryptoOnrampProviderInterface`](#cryptoonrampproviderinterface)s.

**Example**

%%docs/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDERS%%

#### getCryptoOnrampQuote

Quote a crypto-to-TON onramp — given a source asset/chain and target TON asset, returns the rate, expected amount, and provider metadata needed to call [`createCryptoOnrampDeposit`](#createcryptoonrampdeposit).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetCryptoOnrampQuoteOptions`](#getcryptoonrampquoteoptions) | Source asset, target asset, amount and optional provider override. |
| `options.amount`\* | `string` | Amount to onramp (either source or target crypto, depending on isSourceAmount) |
| `options.sourceCurrencyAddress`\* | `string` | Source crypto currency address (contract address or 0x0... for native) |
| `options.sourceChain`\* | `string` | Source chain identifier in CAIP-2 format (e.g. 'eip155:1' for Ethereum mainnet, 'eip155:42161' for Arbitrum One). Providers map this to their own chain identifiers internally. |
| `options.targetCurrencyAddress`\* | `string` | Target crypto currency address on TON (contract address or 0x0... for native) |
| `options.recipientAddress`\* | `string` | TON address that will receive the target crypto |
| `options.refundAddress` | `string` | Refund address for the source crypto |
| `options.isSourceAmount` | `boolean` | If true, `amount` is the source amount to spend. If false, `amount` is the target amount to receive. Defaults to true when omitted. |
| `options.providerOptions` | `TProviderOptions` | Provider-specific options |
| `options.providerId` | `string` | Provider to quote against; defaults to the registered default provider. |

Returns: <a href="#getcryptoonrampquotereturntype"><code>GetCryptoOnrampQuoteReturnType</code></a> — Quote with pricing details and the provider metadata required to create a deposit.

#### getCryptoOnrampStatus

Read the current status of a crypto-onramp deposit by id — typically polled until the result is `'success'` or `'failed'`.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetCryptoOnrampStatusOptions`](#getcryptoonrampstatusoptions) | Deposit id, originating provider id and optional provider override. |
| `options.depositId`\* | `string` | Deposit id |
| `options.providerId`\* | `string` | Identifier of the provider that issued this deposit |

Returns: <a href="#getcryptoonrampstatusreturntype"><code>GetCryptoOnrampStatusReturnType</code></a> — Current [`CryptoOnrampStatus`](#cryptoonrampstatus) of the deposit.

#### watchCryptoOnrampProviders

Subscribe to crypto-onramp provider lifecycle — fires `onChange` whenever a new provider is registered or the default crypto-onramp provider switches.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`WatchCryptoOnrampProvidersParameters`](#watchcryptoonrampprovidersparameters) | Update callback. |
| `parameters.onChange`\* | `() => void` | Callback fired whenever a crypto-onramp provider is registered or the default crypto-onramp provider changes. |

Returns: <a href="#watchcryptoonrampprovidersreturntype"><code>WatchCryptoOnrampProvidersReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

### Jettons

#### createTransferJettonTransaction

Build a jetton transfer [`TransactionRequest`](#transactionrequest) for the selected wallet without sending it — useful when the UI needs to inspect or batch transactions before signing; throws `Error('Wallet not connected')` when no wallet is selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`CreateTransferJettonTransactionParameters`](#createtransferjettontransactionparameters) | Jetton, recipient, amount, decimals and optional comment. |
| `parameters.jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address being transferred. |
| `parameters.recipientAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Recipient who should receive the jettons. |
| `parameters.amount`\* | `string` | Amount in jetton units as a human-readable decimal string (e.g., `"1.5"`). |
| `parameters.jettonDecimals`\* | `number` | Decimals declared by the jetton master; used to convert `amount` into raw smallest units. |
| `parameters.comment` | `string` | Optional human-readable comment attached to the transfer. |

Returns: <code>Promise&lt;</code><a href="#createtransferjettontransactionreturntype"><code>CreateTransferJettonTransactionReturnType</code></a><code>&gt;</code> — Transaction request ready to pass to `sendTransaction`.

**Example**

%%docs/examples/src/appkit/actions/jettons#CREATE_TRANSFER_JETTON_TRANSACTION%%

#### getJettonBalance

Read a jetton balance for a given owner — derives the owner's jetton-wallet address from the master, then fetches and formats the balance using the supplied decimals.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetJettonBalanceOptions`](#getjettonbalanceoptions) | Jetton master, owner address, decimals and optional network override. |
| `options.jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address (the token, not the user's wallet for it). |
| `options.ownerAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Owner of the jetton wallet — typically the connected user's address. |
| `options.jettonDecimals`\* | `number` | Decimals declared by the jetton master; used to format the raw balance into a human-readable string. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

Returns: <code>Promise&lt;</code><a href="#getjettonbalancereturntype"><code>GetJettonBalanceReturnType</code></a><code>&gt;</code> — Balance as a human-readable decimal string in the jetton's units.

**Example**

%%docs/examples/src/appkit/actions/jettons#GET_JETTON_BALANCE%%

#### getJettonInfo

Fetch token metadata for a jetton master — name, symbol, decimals, image and description as reported by the indexer; returns `null` when no metadata is available.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetJettonInfoOptions`](#getjettoninfooptions) | Jetton master address and optional network override. |
| `options.address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address whose metadata is being fetched. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to query. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

Returns: <code>Promise&lt;</code><a href="#getjettoninforeturntype"><code>GetJettonInfoReturnType</code></a><code>&gt;</code> — Jetton metadata, or `null` if the indexer has no record.

**Example**

%%docs/examples/src/appkit/actions/jettons#GET_JETTON_INFO%%

#### getJettonWalletAddress

Derive the jetton-wallet address for a given owner — the per-owner contract that actually holds the jetton balance for `jettonAddress`.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetJettonWalletAddressOptions`](#getjettonwalletaddressoptions) | Jetton master, owner address and optional network override. |
| `options.jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address. |
| `options.ownerAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Owner whose jetton wallet should be derived. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to query. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

Returns: <code>Promise&lt;</code><a href="#getjettonwalletaddressreturntype"><code>GetJettonWalletAddressReturnType</code></a><code>&gt;</code> — User-friendly address of the owner's jetton wallet.

**Example**

%%docs/examples/src/appkit/actions/jettons#GET_JETTON_WALLET_ADDRESS%%

#### getJettons

List jettons held by the currently selected wallet, returning `null` when no wallet is connected (use [`getJettonsByAddress`](#getjettonsbyaddress) for an arbitrary address).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options` | [`GetJettonsOptions`](#getjettonsoptions) | Optional network override and pagination. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to read jettons from. Defaults to the selected wallet's network. |
| `options.limit` | `number` | Maximum number of jettons to return. |
| `options.offset` | `number` | Number of jettons to skip before returning results — used for pagination. |

Returns: <code>Promise&lt;</code><a href="#getjettonsreturntype"><code>GetJettonsReturnType</code></a><code>&gt;</code> — Jettons response for the selected wallet, or `null` when none is selected.

**Example**

%%docs/examples/src/appkit/actions/jettons#GET_JETTONS%%

#### getJettonsByAddress

List jettons held by an arbitrary address — useful for inspecting wallets that aren't selected in AppKit (use [`getJettons`](#getjettons) for the selected wallet); raw balances are formatted with each jetton's declared decimals, and entries without decimals are dropped.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`GetJettonsByAddressOptions`](#getjettonsbyaddressoptions) | Owner address, optional network override and pagination. |
| `options.address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Owner address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to read the jettons from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |
| `options.limit` | `number` | Maximum number of jettons to return. |
| `options.offset` | `number` | Number of jettons to skip before returning results — used for pagination. |

Returns: <code>Promise&lt;</code><a href="#getjettonsbyaddressreturntype"><code>GetJettonsByAddressReturnType</code></a><code>&gt;</code> — Jettons response with formatted balances.

**Example**

%%docs/examples/src/appkit/actions/jettons#GET_JETTONS_BY_ADDRESS%%

#### transferJetton

Build and send a jetton transfer from the selected wallet in one step (use [`createTransferJettonTransaction`](#createtransferjettontransaction) + `sendTransaction` if you need to inspect the transaction first); throws `Error('Wallet not connected')` when no wallet is selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`TransferJettonParameters`](#transferjettonparameters) | Jetton, recipient, amount, decimals and optional comment. |
| `parameters.jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address being transferred. |
| `parameters.recipientAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Recipient who should receive the jettons. |
| `parameters.amount`\* | `string` | Amount in jetton units as a human-readable decimal string (e.g., `"1.5"`). |
| `parameters.jettonDecimals`\* | `number` | Decimals declared by the jetton master; used to convert `amount` into raw smallest units. |
| `parameters.comment` | `string` | Optional human-readable comment attached to the transfer. |

Returns: <code>Promise&lt;</code><a href="#transferjettonreturntype"><code>TransferJettonReturnType</code></a><code>&gt;</code> — Wallet response carrying the BoC of the sent transaction.

**Example**

%%docs/examples/src/appkit/actions/jettons#TRANSFER_JETTON%%

#### watchJettons

Subscribe to jetton-balance updates for the currently selected wallet, automatically rebinding when the user connects, switches, or disconnects (use [`watchJettonsByAddress`](#watchjettonsbyaddress) for a fixed address).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchJettonsOptions`](#watchjettonsoptions) | Update callback and optional network override. |
| `options.onChange`\* | <code>(update: </code><a href="#jettonupdate"><code>JettonUpdate</code></a><code>) =&gt; void</code> | Callback fired on every jetton-balance update from the streaming provider. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the selected wallet's network. |

Returns: <a href="#watchjettonsreturntype"><code>WatchJettonsReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

#### watchJettonsByAddress

Subscribe to jetton-balance updates for an arbitrary owner address (use [`watchJettons`](#watchjettons) for the selected wallet).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `options`\* | [`WatchJettonsByAddressOptions`](#watchjettonsbyaddressoptions) | Owner address, update callback and optional network override. |
| `options.address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Owner address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `options.onChange`\* | <code>(update: </code><a href="#jettonupdate"><code>JettonUpdate</code></a><code>) =&gt; void</code> | Callback fired on every jetton-balance update from the streaming provider. |
| `options.network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

Returns: <a href="#watchjettonsbyaddressreturntype"><code>WatchJettonsByAddressReturnType</code></a> — Unsubscribe function — call it to stop receiving updates.

### Signing

#### signText

Ask the connected wallet to sign a plain text message; throws `Error('Wallet not connected')` if no wallet is currently selected.

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | [`SignTextParameters`](#signtextparameters) | Text to sign and optional network override. |
| `parameters.text`\* | `string` | UTF-8 text the user is asked to sign. |
| `parameters.network` | <a href="#network"><code>Network</code></a> | Network to issue the sign request against. Defaults to the AppKit's selected network. |

Returns: `Promise<SignTextReturnType>` — Signature and signed payload, as returned by the wallet.

**Example**

%%docs/examples/src/appkit/actions/signing#SIGN_TEXT%%

### Transactions

#### transferTon

Build and send a TON transfer from the selected wallet in one step (use `createTransferTonTransaction` + `sendTransaction` if you need to inspect the transaction first).

| Parameter | Type | Description |
| --- | --- | --- |
| `appKit`\* | [`AppKit`](#appkit) | Runtime instance. |
| `parameters`\* | `TransferTonParameters` | Recipient, amount and optional payload/comment. |
| `parameters.recipientAddress`\* | `string` | Recipient address |
| `parameters.amount`\* | `string` | Amount in TONs |
| `parameters.comment` | `string` | Human-readable text comment (will be converted to payload) |
| `parameters.payload` | `string` | Message payload data encoded in Base64 (overrides comment if provided) |
| `parameters.stateInit` | `string` | Initial state for deploying a new contract, encoded in Base64 |

Returns: `Promise<TransferTonReturnType>` — Wallet response carrying the BoC of the sent transaction.

**Example**

%%docs/examples/src/appkit/actions/transaction#TRANSFER_TON%%

## Type

### Balances

#### BalanceUpdate

Update payload delivered to [`watchBalance`](#watchbalance) / [`watchBalanceByAddress`](#watchbalancebyaddress) subscribers when the watched address's TON balance changes.

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | `'balance'` | The update type field |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The account address |
| `rawBalance`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | The account balance in nano units |
| `balance`\* | `string` | The formatted balance |
| `status`\* | <a href="#streamingupdatestatus"><code>StreamingUpdateStatus</code></a> | The finality of the update |

#### GetBalanceByAddressOptions

Options for [`getBalanceByAddress`](#getbalancebyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Wallet address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

#### GetBalanceByAddressReturnType

Return type of [`getBalanceByAddress`](#getbalancebyaddress).

```ts
type GetBalanceByAddressReturnType = TokenAmount;
```

#### GetBalanceOptions

Options for [`getBalance`](#getbalance).

| Field | Type | Description |
| --- | --- | --- |
| `network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the selected wallet's network. |

#### GetBalanceReturnType

Return type of [`getBalance`](#getbalance).

```ts
type GetBalanceReturnType = TokenAmount | null;
```

#### StreamingUpdateStatus

Finality stage carried by every streaming update — `'pending'` (in mempool), `'confirmed'` (included in a block), `'finalized'` (irreversible), or `'invalidated'` (rolled back).

```ts
type StreamingUpdateStatus = 'pending' | 'confirmed' | 'finalized' | 'invalidated';
```

#### WatchBalanceByAddressOptions

Options for [`watchBalanceByAddress`](#watchbalancebyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Wallet address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |
| `onChange`\* | <code>(update: </code><a href="#balanceupdate"><code>BalanceUpdate</code></a><code>) =&gt; void</code> | Callback fired on every balance update from the streaming provider. |

#### WatchBalanceByAddressReturnType

Return type of [`watchBalanceByAddress`](#watchbalancebyaddress) — call to stop receiving updates.

```ts
type WatchBalanceByAddressReturnType = () => void;
```

#### WatchBalanceOptions

Options for [`watchBalance`](#watchbalance).

| Field | Type | Description |
| --- | --- | --- |
| `network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the selected wallet's network. |
| `onChange`\* | <code>(update: </code><a href="#balanceupdate"><code>BalanceUpdate</code></a><code>) =&gt; void</code> | Callback fired on every balance update from the streaming provider. |

#### WatchBalanceReturnType

Return type of [`watchBalance`](#watchbalance) — call to stop receiving updates.

```ts
type WatchBalanceReturnType = () => void;
```

### Connectors

#### AddConnectorParameters

Connector instance or factory accepted by [`addConnector`](#addconnector) — same shape used in [`AppKitConfig`](#appkitconfig)`.connectors`.

```ts
type AddConnectorParameters = ConnectorInput;
```

#### AddConnectorReturnType

Return type of [`addConnector`](#addconnector) — call to remove the connector from AppKit.

```ts
type AddConnectorReturnType = () => void;
```

#### ConnectParameters

Parameters accepted by [`connect`](#connect).

| Field | Type | Description |
| --- | --- | --- |
| `connectorId`\* | `string` | Id of the registered connector to drive the connection through (e.g., `'tonconnect'`). |

#### ConnectReturnType

Return type of [`connect`](#connect).

```ts
type ConnectReturnType = void;
```

#### Connector

Wallet connector contract — the protocol-specific bridge (TonConnect, embedded wallet, …) AppKit drives once you register it via [`AppKitConfig`](#appkitconfig)`.connectors`.

| Field | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | Stable connector identifier, unique within an AppKit instance. |
| `type`\* | `string` | Protocol type (e.g. `'tonconnect'`). Multiple connectors can share the same type. |
| `metadata`\* | <a href="#connectormetadata"><code>ConnectorMetadata</code></a> | Display metadata (name, icon) shown in connect UIs. |
| `destroy`\* | `() => void` | Release any resources held by the connector. Call on app teardown. |
| `connectWallet`\* | <code>(network?: </code><a href="#network"><code>Network</code></a><code>) =&gt; Promise&lt;void&gt;</code> | Initiate a wallet connection flow on the given network. |
| `disconnectWallet`\* | `() => Promise<void>` | Disconnect the currently connected wallet, if any. |
| `getConnectedWallets`\* | <code>() =&gt; </code><a href="#walletinterface"><code>WalletInterface</code></a><code>[]</code> | Wallets currently connected through this connector. |

#### ConnectorFactory

Factory that builds a [`Connector`](#connector) from [`ConnectorFactoryContext`](#connectorfactorycontext); AppKit calls it at registration time.

```ts
type ConnectorFactory = (ctx: ConnectorFactoryContext) => Connector;
```

#### ConnectorFactoryContext

Context that AppKit injects into a [`ConnectorFactory`](#connectorfactory) when building the connector at registration time.

| Field | Type | Description |
| --- | --- | --- |
| `networkManager`\* | <a href="#appkitnetworkmanager"><code>AppKitNetworkManager</code></a> | Network manager the connector should use for client lookups and default-network reads. |
| `eventEmitter`\* | <a href="#appkitemitter"><code>AppKitEmitter</code></a> | Event emitter the connector should publish wallet/connection events to. |
| `ssr` | `boolean` | `true` when the connector is constructed during server-side rendering — connectors may skip browser-only setup. |

#### ConnectorInput

Either a ready-made [`Connector`](#connector) or a [`ConnectorFactory`](#connectorfactory) that produces one — the value accepted by [`addConnector`](#addconnector) and [`AppKitConfig`](#appkitconfig)`.connectors`.

```ts
type ConnectorInput = Connector | ConnectorFactory;
```

#### ConnectorMetadata

Display metadata for a [`Connector`](#connector), surfaced in connect UIs to help users pick the right wallet.

| Field | Type | Description |
| --- | --- | --- |
| `name`\* | `string` | Human-readable connector name (e.g., `'TonConnect'`). |
| `iconUrl` | `string` | Optional URL of an icon shown next to the name. |

#### DisconnectParameters

Parameters accepted by [`disconnect`](#disconnect).

| Field | Type | Description |
| --- | --- | --- |
| `connectorId`\* | `string` | Id of the registered connector whose wallet should be disconnected. |

#### DisconnectReturnType

Return type of [`disconnect`](#disconnect).

```ts
type DisconnectReturnType = void;
```

#### GetConnectorByIdOptions

Options for [`getConnectorById`](#getconnectorbyid).

| Field | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | Id of the connector to look up. |

#### GetConnectorByIdReturnType

Return type of [`getConnectorById`](#getconnectorbyid) — `undefined` when no connector with that id is registered.

```ts
type GetConnectorByIdReturnType = Connector | undefined;
```

#### GetConnectorsReturnType

Return type of [`getConnectors`](#getconnectors) — read-only snapshot of registered connectors.

```ts
type GetConnectorsReturnType = readonly Connector[];
```

#### WatchConnectorByIdParameters

Parameters accepted by [`watchConnectorById`](#watchconnectorbyid).

| Field | Type | Description |
| --- | --- | --- |
| `id`\* | `string` | Id of the connector to watch. |
| `onChange`\* | <code>(connector: </code><a href="#connector"><code>Connector</code></a><code> \| undefined) =&gt; void</code> | Callback fired after each wallet-connection event with the current connector (or `undefined` when none is registered under this id). |

#### WatchConnectorByIdReturnType

Return type of [`watchConnectorById`](#watchconnectorbyid) — call to stop receiving updates.

```ts
type WatchConnectorByIdReturnType = () => void;
```

#### WatchConnectorsParameters

Parameters accepted by [`watchConnectors`](#watchconnectors).

| Field | Type | Description |
| --- | --- | --- |
| `onChange`\* | <code>(connectors: readonly </code><a href="#connector"><code>Connector</code></a><code>[]) =&gt; void</code> | Callback fired after each wallet-connection event with the current list of registered connectors. |

#### WatchConnectorsReturnType

Return type of [`watchConnectors`](#watchconnectors) — call to stop receiving updates.

```ts
type WatchConnectorsReturnType = () => void;
```

### Core

#### AppKitConfig

Constructor options for [`AppKit`](#appkit) — networks, connectors, providers and runtime flags.

| Field | Type | Description |
| --- | --- | --- |
| `networks` | <a href="#networkadapters"><code>NetworkAdapters</code></a> | Map of chain id to api-client config; if omitted, AppKit defaults to mainnet only. |
| `connectors` | <a href="#connectorinput"><code>ConnectorInput</code></a><code>[]</code> | Wallet connectors registered at startup. |
| `defaultNetwork` | <a href="#network"><code>Network</code></a> | Default network connectors (e.g. TonConnect) enforce on new connections; `undefined` to allow any. |
| `providers` | <a href="#providerinput"><code>ProviderInput</code></a><code>[]</code> | Defi/onramp providers registered at startup. |
| `ssr` | `boolean` | Set to `true` to enable server-side rendering support. |

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
| `network`\* | <a href="#network"><code>Network</code></a><code> \| undefined</code> | _TODO: describe_ |

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
| `source` | `string` | _TODO: describe_ |
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
| `wallets`\* | <a href="#walletinterface"><code>WalletInterface</code></a><code>[]</code> | _TODO: describe_ |
| `connectorId`\* | `string` | _TODO: describe_ |

#### WalletDisconnectedPayload

Payload of `connector:disconnected` events — id of the connector whose wallet was just disconnected.

| Field | Type | Description |
| --- | --- | --- |
| `connectorId`\* | `string` | _TODO: describe_ |

### Crypto Onramp

#### CreateCryptoOnrampDepositOptions

Options for [`createCryptoOnrampDeposit`](#createcryptoonrampdeposit) — extends [`CryptoOnrampDepositParams`](#cryptoonrampdepositparams) with an optional provider override.

```ts
type CreateCryptoOnrampDepositOptions = CryptoOnrampDepositParams<T> & {
    /** Provider to create the deposit through; defaults to `quote.providerId`, then to the default provider. */
    providerId?: string;
};
```

#### CreateCryptoOnrampDepositReturnType

Return type of [`createCryptoOnrampDeposit`](#createcryptoonrampdeposit).

```ts
type CreateCryptoOnrampDepositReturnType = Promise<CryptoOnrampDeposit>;
```

#### CryptoOnrampDeposit

Deposit details returned by a crypto onramp provider.

The user must send `amount` of `sourceCurrencyAddress` to `address` on `sourceChain`
to complete the onramp; the provider then delivers the target crypto to the
user's TON address.

| Field | Type | Description |
| --- | --- | --- |
| `depositId`\* | `string` | Deposit id |
| `address`\* | `string` | Deposit address on the source chain |
| `amount`\* | `string` | Exact amount of source crypto the user must send |
| `sourceCurrencyAddress`\* | `string` | Source crypto currency address (contract address or 0x0... for native) |
| `sourceChain`\* | `string` | Source chain identifier in CAIP-2 format (e.g. 'eip155:42161'). |
| `memo` | `string` | Optional memo / tag required by some chains (e.g. XRP, TON comment) |
| `expiresAt` | `number` | Unix timestamp (ms) after which the deposit offer is no longer valid |
| `chainWarning` | `string` | Chain-specific warning to show the user (e.g. "send only on Solana") |
| `providerId`\* | `string` | Identifier of the provider that issued this deposit |

#### CryptoOnrampDepositParams

Parameters for creating a crypto onramp deposit.

The recipient is taken from `quote.recipientAddress` set at quote time.

| Field | Type | Description |
| --- | --- | --- |
| `quote`\* | <a href="#cryptoonrampquote"><code>CryptoOnrampQuote</code></a><code>&lt;TQuoteMetadata&gt;</code> | Quote to execute the deposit against (contains recipientAddress and provider metadata) |
| `refundAddress`\* | `string` | Address to refund the crypto to in case of failure |
| `providerOptions` | `TProviderOptions` | Provider-specific options |

#### CryptoOnrampProviderInterface

Interface that all crypto onramp providers must implement

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | `'crypto-onramp'` | _TODO: describe_ |
| `providerId`\* | `string` | Unique identifier for the provider |
| `getMetadata`\* | <code>() =&gt; </code><a href="#cryptoonrampprovidermetadata"><code>CryptoOnrampProviderMetadata</code></a> | Get static metadata for the provider (display name, logo, url). |
| `getQuote`\* | <code>(params: </code><a href="#cryptoonrampquoteparams"><code>CryptoOnrampQuoteParams</code></a><code>&lt;TQuoteOptions&gt;) =&gt; Promise&lt;</code><a href="#cryptoonrampquote"><code>CryptoOnrampQuote</code></a><code>&gt;</code> | Get a quote for onramping from another crypto asset into a TON asset |
| `createDeposit`\* | <code>(params: </code><a href="#cryptoonrampdepositparams"><code>CryptoOnrampDepositParams</code></a><code>&lt;TDepositOptions&gt;) =&gt; Promise&lt;</code><a href="#cryptoonrampdeposit"><code>CryptoOnrampDeposit</code></a><code>&gt;</code> | Create a deposit for a previously obtained quote |
| `getStatus`\* | <code>(params: </code><a href="#cryptoonrampstatusparams"><code>CryptoOnrampStatusParams</code></a><code>) =&gt; Promise&lt;</code><a href="#cryptoonrampstatus"><code>CryptoOnrampStatus</code></a><code>&gt;</code> | Get the status of a deposit |
| `getSupportedNetworks`\* | <code>() =&gt; </code><a href="#network"><code>Network</code></a><code>[]</code> | Networks this provider can operate on. Consumers should check before calling provider methods. Implementations may return a static list or compute it dynamically (e.g. from runtime config). |

#### CryptoOnrampProviderMetadata

Static metadata for a crypto-onramp provider.

| Field | Type | Description |
| --- | --- | --- |
| `name`\* | `string` | Human-readable provider name (e.g. 'Swaps.xyz') |
| `logo` | `string` | URL to the provider's logo image |
| `url` | `string` | URL to the provider's website |
| `isRefundAddressRequired` | `boolean` | Whether this provider requires a refund address on the source chain. When true, the UI must collect a refund address before creating a deposit. |
| `isReversedAmountSupported` | `boolean` | Whether this provider supports reversed (target-amount) quotes. When false, the UI should hide the direction toggle and only allow source-amount input. |

#### CryptoOnrampProviderMetadataOverride

Used in provider configuration to override fields of the provider's metadata.

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Override the provider's display name |
| `logo` | `string` | Override the provider's logo URL |
| `url` | `string` | Override the provider's website URL |

#### CryptoOnrampQuote

Crypto onramp quote response with pricing information

| Field | Type | Description |
| --- | --- | --- |
| `sourceCurrencyAddress`\* | `string` | Source crypto currency address (contract address or 0x0... for native) |
| `sourceChain`\* | `string` | Source chain identifier in CAIP-2 format (e.g. 'eip155:42161'). |
| `targetCurrencyAddress`\* | `string` | Target crypto currency address on TON (contract address or 0x0... for native) |
| `sourceAmount`\* | `string` | Amount of source crypto to send |
| `targetAmount`\* | `string` | Amount of target crypto to receive |
| `rate`\* | `string` | Exchange rate (amount of target per 1 unit of source) |
| `recipientAddress`\* | `string` | TON address that will receive the target crypto |
| `providerId`\* | `string` | Identifier of the crypto onramp provider |
| `metadata` | `TMetadata` | Provider-specific metadata for the quote (e.g. raw response needed to execute) |

#### CryptoOnrampQuoteParams

Parameters for requesting a crypto-to-crypto onramp quote.

The target network is always TON, so only the source side is parameterised.

| Field | Type | Description |
| --- | --- | --- |
| `amount`\* | `string` | Amount to onramp (either source or target crypto, depending on isSourceAmount) |
| `sourceCurrencyAddress`\* | `string` | Source crypto currency address (contract address or 0x0... for native) |
| `sourceChain`\* | `string` | Source chain identifier in CAIP-2 format (e.g. 'eip155:1' for Ethereum mainnet, 'eip155:42161' for Arbitrum One). Providers map this to their own chain identifiers internally. |
| `targetCurrencyAddress`\* | `string` | Target crypto currency address on TON (contract address or 0x0... for native) |
| `recipientAddress`\* | `string` | TON address that will receive the target crypto |
| `refundAddress` | `string` | Refund address for the source crypto |
| `isSourceAmount` | `boolean` | If true, `amount` is the source amount to spend. If false, `amount` is the target amount to receive. Defaults to true when omitted. |
| `providerOptions` | `TProviderOptions` | Provider-specific options |

#### CryptoOnrampStatus

Final state of a crypto-onramp deposit returned by [`getCryptoOnrampStatus`](#getcryptoonrampstatus) — `'success'` (delivered to the recipient), `'pending'` (still in flight), or `'failed'` (provider could not complete the deposit).

```ts
type CryptoOnrampStatus = 'success' | 'pending' | 'failed';
```

#### CryptoOnrampStatusParams

Parameters accepted by [`getCryptoOnrampStatus`](#getcryptoonrampstatus) — identifies a previously created deposit and the provider that issued it.

| Field | Type | Description |
| --- | --- | --- |
| `depositId`\* | `string` | Deposit id |
| `providerId`\* | `string` | Identifier of the provider that issued this deposit |

#### GetCryptoOnrampProviderOptions

Options for [`getCryptoOnrampProvider`](#getcryptoonrampprovider).

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Provider id to look up; when omitted, returns the registered default provider. |

#### GetCryptoOnrampProviderReturnType

Return type of [`getCryptoOnrampProvider`](#getcryptoonrampprovider).

```ts
type GetCryptoOnrampProviderReturnType = CryptoOnrampProviderInterface;
```

#### GetCryptoOnrampProvidersReturnType

Return type of [`getCryptoOnrampProviders`](#getcryptoonrampproviders).

```ts
type GetCryptoOnrampProvidersReturnType = CryptoOnrampProviderInterface[];
```

#### GetCryptoOnrampQuoteOptions

Options for [`getCryptoOnrampQuote`](#getcryptoonrampquote) — extends [`CryptoOnrampQuoteParams`](#cryptoonrampquoteparams) with an optional provider override.

```ts
type GetCryptoOnrampQuoteOptions = CryptoOnrampQuoteParams<T> & {
    /** Provider to quote against; defaults to the registered default provider. */
    providerId?: string;
};
```

#### GetCryptoOnrampQuoteReturnType

Return type of [`getCryptoOnrampQuote`](#getcryptoonrampquote).

```ts
type GetCryptoOnrampQuoteReturnType = Promise<CryptoOnrampQuote>;
```

#### GetCryptoOnrampStatusOptions

Options for [`getCryptoOnrampStatus`](#getcryptoonrampstatus) — extends [`CryptoOnrampStatusParams`](#cryptoonrampstatusparams) with an optional provider override.

```ts
type GetCryptoOnrampStatusOptions = CryptoOnrampStatusParams & {
    /** Provider that issued the deposit; defaults to the registered default provider. */
    providerId?: string;
};
```

#### GetCryptoOnrampStatusReturnType

Return type of [`getCryptoOnrampStatus`](#getcryptoonrampstatus).

```ts
type GetCryptoOnrampStatusReturnType = Promise<CryptoOnrampStatus>;
```

#### WatchCryptoOnrampProvidersParameters

Parameters accepted by [`watchCryptoOnrampProviders`](#watchcryptoonrampproviders).

| Field | Type | Description |
| --- | --- | --- |
| `onChange`\* | `() => void` | Callback fired whenever a crypto-onramp provider is registered or the default crypto-onramp provider changes. |

#### WatchCryptoOnrampProvidersReturnType

Return type of [`watchCryptoOnrampProviders`](#watchcryptoonrampproviders) — call to stop receiving updates.

```ts
type WatchCryptoOnrampProvidersReturnType = () => void;
```

### DeFi

#### DefiManagerAPI

Swap API interface exposed by SwapManager

| Field | Type | Description |
| --- | --- | --- |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |
| `registerProvider`\* | <code>(provider: </code><a href="#providerinput"><code>ProviderInput</code></a><code>&lt;T&gt;) =&gt; void</code> | Register a new provider. If a provider with the same id is already registered, it is replaced. |
| `removeProvider`\* | `(provider: T) => void` | Remove a previously registered provider. No-op if the provider was not registered. |
| `setDefaultProvider`\* | `(providerId: string) => void` | Set the default provider |
| `getProvider`\* | `(providerId?: string) => T` | Get a registered provider |
| `getProviders`\* | `() => T[]` | Get all registered providers. The returned array keeps a stable reference until the provider list changes. |
| `hasProvider`\* | `(providerId: string) => boolean` | Check if a provider is registered |

#### DefiProvider

Base interface for all DeFi providers

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | <a href="#defiprovidertype"><code>DefiProviderType</code></a> | _TODO: describe_ |
| `getSupportedNetworks`\* | <code>() =&gt; </code><a href="#network"><code>Network</code></a><code>[]</code> | Networks this provider can operate on. Consumers should check before calling provider methods. Implementations may return a static list or compute it dynamically (e.g. from runtime config). |
| `providerId`\* | `string` | _TODO: describe_ |

#### DefiProviderType

Discriminator that tags every [`DefiProvider`](#defiprovider) with its kind — `'swap'`, `'staking'`, `'onramp'`, or `'crypto-onramp'`; used by [`registerProvider`](#registerprovider) to dispatch to the right manager.

```ts
type DefiProviderType = 'swap' | 'staking' | 'onramp' | 'crypto-onramp';
```

#### ProviderInput

Either a ready-made DeFi/onramp provider instance or a factory that produces one — the value accepted by [`AppKitConfig`](#appkitconfig)`.providers` and [`registerProvider`](#registerprovider).

```ts
type ProviderInput = T | ProviderFactory<T>;
```

### Jettons

#### AddressBook

Map of raw addresses to their resolved metadata, returned alongside indexed lists (e.g. [`JettonsResponse`](#jettonsresponse)) so consumers can render labels without extra lookups.

```ts
type AddressBook = {
    [key: UserFriendlyAddress]: AddressBookEntry;
};
```

#### AddressBookEntry

Single entry inside an [`AddressBook`](#addressbook) — pairs the user-friendly address with optional domain name and the list of contract interfaces it implements.

| Field | Type | Description |
| --- | --- | --- |
| `address` | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The human-readable representation of the blockchain address |
| `domain` | `string` | The domain name associated with the address if available |
| `interfaces`\* | `string[]` | List of supported interfaces by the address |

#### CreateTransferJettonTransactionParameters

Parameters accepted by [`createTransferJettonTransaction`](#createtransferjettontransaction) and [`transferJetton`](#transferjetton).

| Field | Type | Description |
| --- | --- | --- |
| `jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address being transferred. |
| `recipientAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Recipient who should receive the jettons. |
| `amount`\* | `string` | Amount in jetton units as a human-readable decimal string (e.g., `"1.5"`). |
| `jettonDecimals`\* | `number` | Decimals declared by the jetton master; used to convert `amount` into raw smallest units. |
| `comment` | `string` | Optional human-readable comment attached to the transfer. |

#### CreateTransferJettonTransactionReturnType

Return type of [`createTransferJettonTransaction`](#createtransferjettontransaction).

```ts
type CreateTransferJettonTransactionReturnType = TransactionRequest;
```

#### GetJettonBalanceOptions

Options for [`getJettonBalance`](#getjettonbalance).

| Field | Type | Description |
| --- | --- | --- |
| `jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address (the token, not the user's wallet for it). |
| `ownerAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Owner of the jetton wallet — typically the connected user's address. |
| `jettonDecimals`\* | `number` | Decimals declared by the jetton master; used to format the raw balance into a human-readable string. |
| `network` | <a href="#network"><code>Network</code></a> | Network to read the balance from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

#### GetJettonBalanceReturnType

Return type of [`getJettonBalance`](#getjettonbalance).

```ts
type GetJettonBalanceReturnType = TokenAmount;
```

#### GetJettonInfoOptions

Options for [`getJettonInfo`](#getjettoninfo).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address whose metadata is being fetched. |
| `network` | <a href="#network"><code>Network</code></a> | Network to query. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

#### GetJettonInfoReturnType

Return type of [`getJettonInfo`](#getjettoninfo) — `null` when the indexer has no record for that master address.

```ts
type GetJettonInfoReturnType = JettonInfo | null;
```

#### GetJettonWalletAddressOptions

Options for [`getJettonWalletAddress`](#getjettonwalletaddress).

| Field | Type | Description |
| --- | --- | --- |
| `jettonAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Jetton master contract address. |
| `ownerAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Owner whose jetton wallet should be derived. |
| `network` | <a href="#network"><code>Network</code></a> | Network to query. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

#### GetJettonWalletAddressReturnType

Return type of [`getJettonWalletAddress`](#getjettonwalletaddress).

```ts
type GetJettonWalletAddressReturnType = UserFriendlyAddress;
```

#### GetJettonsByAddressOptions

Options for [`getJettonsByAddress`](#getjettonsbyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Owner address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `network` | <a href="#network"><code>Network</code></a> | Network to read the jettons from. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |
| `limit` | `number` | Maximum number of jettons to return. |
| `offset` | `number` | Number of jettons to skip before returning results — used for pagination. |

#### GetJettonsByAddressReturnType

Return type of [`getJettonsByAddress`](#getjettonsbyaddress).

```ts
type GetJettonsByAddressReturnType = JettonsResponse;
```

#### GetJettonsOptions

Options for [`getJettons`](#getjettons).

| Field | Type | Description |
| --- | --- | --- |
| `network` | <a href="#network"><code>Network</code></a> | Network to read jettons from. Defaults to the selected wallet's network. |
| `limit` | `number` | Maximum number of jettons to return. |
| `offset` | `number` | Number of jettons to skip before returning results — used for pagination. |

#### GetJettonsReturnType

Return type of [`getJettons`](#getjettons) — `null` when no wallet is currently selected.

```ts
type GetJettonsReturnType = JettonsResponse | null;
```

#### Jetton

Fungible TEP-74 token held in the user's TON wallet — carries the master contract address, the user's jetton-wallet address, current balance, and token metadata.

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The Jetton contract address |
| `walletAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The Jetton wallet address |
| `balance`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | The current jetton balance |
| `info`\* | <a href="#tokeninfo"><code>TokenInfo</code></a> | Information about the token |
| `decimalsNumber` | `number` | The number of decimal places used by the token |
| `isVerified`\* | `boolean` | Indicates if the jetton is verified |
| `prices`\* | `JettonPrice[]` | Current prices of the jetton in various currencies |
| `extra` | `{         [key: string]: unknown;     }` | Additional arbitrary data related to the jetton |

#### JettonInfo

Token metadata for a jetton master — name, symbol, decimals, image, and verification status as reported by the indexer.

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string` | _TODO: describe_ |
| `name`\* | `string` | _TODO: describe_ |
| `symbol`\* | `string` | _TODO: describe_ |
| `description`\* | `string` | _TODO: describe_ |
| `decimals` | `number` | _TODO: describe_ |
| `totalSupply` | `string` | _TODO: describe_ |
| `image` | `string` | _TODO: describe_ |
| `image_data` | `string` | _TODO: describe_ |
| `uri` | `string` | _TODO: describe_ |
| `verification` | <a href="#jettonverification"><code>JettonVerification</code></a> | _TODO: describe_ |
| `metadata` | `Record<string, unknown>` | _TODO: describe_ |

#### JettonUpdate

Update payload delivered to [`watchJettons`](#watchjettons) / [`watchJettonsByAddress`](#watchjettonsbyaddress) subscribers when the watched owner's jetton balance changes.

| Field | Type | Description |
| --- | --- | --- |
| `type`\* | `'jettons'` | The update type field |
| `masterAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The master jetton contract address |
| `walletAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The jetton wallet contract address |
| `ownerAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | The owner of the jetton wallet |
| `rawBalance`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Balance in raw smallest units (e.g. nano) |
| `decimals` | `number` | Decimals mapped from metadata if available |
| `balance` | `string` | Human readable formatted balance if decimals are known |
| `status`\* | <a href="#streamingupdatestatus"><code>StreamingUpdateStatus</code></a> | The finality of the update |

#### JettonVerification

Verification metadata reported by the indexer for a [`JettonInfo`](#jettoninfo) — `verified` flag plus optional verifier source.

| Field | Type | Description |
| --- | --- | --- |
| `verified`\* | `boolean` | _TODO: describe_ |
| `source` | `'toncenter' \| 'community' \| 'manual'` | _TODO: describe_ |
| `warnings` | `string[]` | _TODO: describe_ |

#### JettonsResponse

Response payload of [`getJettons`](#getjettons) / [`getJettonsByAddress`](#getjettonsbyaddress) — the list of [`Jetton`](#jetton)s plus the address book that resolves raw addresses inside it.

| Field | Type | Description |
| --- | --- | --- |
| `addressBook`\* | <a href="#addressbook"><code>AddressBook</code></a> | Address book mapping |
| `jettons`\* | <a href="#jetton"><code>Jetton</code></a><code>[]</code> | List of Jettons |

#### TokenInfo

Display metadata for a token (TON, jetton, or NFT) — name, symbol, image and animation as reported by the indexer; surfaced as [`Jetton`](#jetton)`.info`.

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Display name of the token |
| `description` | `string` | Human-readable description of the token |
| `image` | `TokenImage` | Token image in various sizes |
| `animation` | `TokenAnimation` | Animated media associated with the token |
| `symbol` | `string` | Ticker symbol of the token (e.g., "TON", "USDT") |

#### TransferJettonParameters

Parameters accepted by [`transferJetton`](#transferjetton) — same shape as [`CreateTransferJettonTransactionParameters`](#createtransferjettontransactionparameters).

```ts
type TransferJettonParameters = CreateTransferJettonTransactionParameters;
```

#### TransferJettonReturnType

Return type of [`transferJetton`](#transferjetton).

```ts
type TransferJettonReturnType = SendTransactionResponse;
```

#### WatchJettonsByAddressOptions

Options for [`watchJettonsByAddress`](#watchjettonsbyaddress).

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code> \| Address</code> | Owner address — pass a [`UserFriendlyAddress`](#userfriendlyaddress) string or an `Address` instance from `@ton/core`. |
| `onChange`\* | <code>(update: </code><a href="#jettonupdate"><code>JettonUpdate</code></a><code>) =&gt; void</code> | Callback fired on every jetton-balance update from the streaming provider. |
| `network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the connected wallet's network, or the configured default if no wallet is connected. |

#### WatchJettonsByAddressReturnType

Return type of [`watchJettonsByAddress`](#watchjettonsbyaddress) — call to stop receiving updates.

```ts
type WatchJettonsByAddressReturnType = () => void;
```

#### WatchJettonsOptions

Options for [`watchJettons`](#watchjettons).

| Field | Type | Description |
| --- | --- | --- |
| `onChange`\* | <code>(update: </code><a href="#jettonupdate"><code>JettonUpdate</code></a><code>) =&gt; void</code> | Callback fired on every jetton-balance update from the streaming provider. |
| `network` | <a href="#network"><code>Network</code></a> | Network to watch on. Defaults to the selected wallet's network. |

#### WatchJettonsReturnType

Return type of [`watchJettons`](#watchjettons) — call to stop receiving updates.

```ts
type WatchJettonsReturnType = () => void;
```

### Networks

#### ApiClientConfig

API client configuration options

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | _TODO: describe_ |
| `key` | `string` | _TODO: describe_ |

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
| `apiClient` | <a href="#apiclientconfig"><code>ApiClientConfig</code></a><code> \| ApiClient</code> | API client configuration or instance |

#### TonWalletKitOptions

Walletkit-side options shape consumed by [`KitNetworkManager`](#kitnetworkmanager)'s constructor — chiefly the `networks` map keyed by chain id. [`AppKit`](#appkit) constructs the manager for you, so apps rarely instantiate this directly.

| Field | Type | Description |
| --- | --- | --- |
| `walletManifest` | `WalletInfo` | _TODO: describe_ |
| `deviceInfo` | `DeviceInfo` | _TODO: describe_ |
| `sessionManager` | `TONConnectSessionManager` | Custom session manager implementation. If not provided, TONConnectStoredSessionManager will be used. |
| `networks` | <a href="#networkadapters"><code>NetworkAdapters</code></a> | Network configuration |
| `bridge` | `BridgeConfig` | Bridge settings |
| `storage` | `StorageConfig \| StorageAdapter` | Storage settings |
| `validation` | `{         strictMode?: boolean;         allowUnknownWalletVersions?: boolean;     }` | Validation settings |
| `eventProcessor` | `EventProcessorConfig` | Event processor settings |
| `analytics` | `AnalyticsManagerOptions & {         enabled?: boolean;     }` | _TODO: describe_ |
| `dev` | `{         disableNetworkSend?: boolean;         disableManifestDomainCheck?: boolean;     }` | _TODO: describe_ |

### Primitives

#### Base64String

Base64-encoded byte string — used for transaction payloads, BoCs, signatures, and other opaque binary blobs that travel through TonConnect and the indexer APIs.

```ts
type Base64String = string & {
    readonly [base64StringBrand]: never;
};
```

#### ExtraCurrencies

Map of extra-currency ids to raw amounts attached to a transaction message — TON's mechanism for transferring non-jetton native tokens (e.g., wrapped or testnet currencies). Keys are the extra-currency ids defined by the masterchain configuration.

```ts
type ExtraCurrencies = {
    [key: string]: string;
};
```

#### Hex

`0x`-prefixed hexadecimal string used for public keys and other hashes.

```ts
type Hex = `0x${string}` & {
    readonly [hashBrand]: never;
};
```

#### TokenAmount

Decimal string carrying a token amount; preserves precision and avoids floating-point rounding (e.g., `"1.5"` TON, or raw nano units depending on the API).

```ts
type TokenAmount = string;
```

#### UserFriendlyAddress

User-friendly TON wallet address as a base64url string (e.g., `"EQDtFp...4q2"`).

```ts
type UserFriendlyAddress = string;
```

### Signing

#### SignData

Payload the user is asked to sign — discriminated union over `'text'`, `'binary'`, and `'cell'`; nested under [`SignDataRequest`](#signdatarequest)`.data`.

```ts
type SignData = | { type: 'text'; value: SignDataText }
    | { type: 'binary'; value: SignDataBinary }
    | { type: 'cell'; value: SignDataCell };
```

#### SignDataBinary

Binary variant of [`SignData`](#signdata) — opaque byte content the user is asked to sign.

| Field | Type | Description |
| --- | --- | --- |
| `content`\* | <a href="#base64string"><code>Base64String</code></a> | Raw binary content encoded as Base64. |

#### SignDataCell

TON cell variant of [`SignData`](#signdata) — Base64-encoded cell payload paired with the schema needed to parse it.

| Field | Type | Description |
| --- | --- | --- |
| `schema`\* | `string` | TL-B-style schema describing the cell layout so the wallet can render the payload to the user. |
| `content`\* | <a href="#base64string"><code>Base64String</code></a> | Cell content encoded as Base64. |

#### SignDataRequest

Sign-data payload sent to [`WalletInterface`](#walletinterface)`.signData` — discriminated by `data.type` (`'text'`, `'binary'`, or `'cell'`).

| Field | Type | Description |
| --- | --- | --- |
| `network` | <a href="#network"><code>Network</code></a> | Network to issue the sign request against; defaults to the wallet's current network. |
| `from` | `string` | Sender address in raw format; usually omitted, the wallet fills it in. |
| `data`\* | <a href="#signdata"><code>SignData</code></a> | Payload the user is asked to sign. |

#### SignDataResponse

Wallet response to a [`SignDataRequest`](#signdatarequest) — carries the signature plus the canonicalized address, timestamp, and domain the wallet committed to.

| Field | Type | Description |
| --- | --- | --- |
| `signature`\* | `string` | Base64-encoded signature. |
| `address`\* | `string` | Wallet address that signed, in user-friendly format. |
| `timestamp`\* | `number` | Unix timestamp the wallet stamped onto the signature. |
| `domain`\* | `string` | dApp domain the wallet bound the signature to. |
| `payload`\* | <a href="#signdatarequest"><code>SignDataRequest</code></a> | Original payload that was signed, echoed back for binding. |

#### SignDataText

Plain-text variant of [`SignData`](#signdata) — UTF-8 string the user is asked to sign.

| Field | Type | Description |
| --- | --- | --- |
| `content`\* | `string` | UTF-8 text the user signs. |

#### SignTextParameters

Parameters accepted by `signText`.

| Field | Type | Description |
| --- | --- | --- |
| `text`\* | `string` | UTF-8 text the user is asked to sign. |
| `network` | <a href="#network"><code>Network</code></a> | Network to issue the sign request against. Defaults to the AppKit's selected network. |

### Staking

#### StakeParams

Parameters for staking TON

| Field | Type | Description |
| --- | --- | --- |
| `quote`\* | <a href="#stakingquote"><code>StakingQuote</code></a> | The staking quote based on which the transaction is built |
| `userAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Address of the user performing the staking |
| `providerOptions` | `TProviderOptions` | Provider-specific options |

#### StakingAPI

Staking API interface exposed by StakingManager

| Field | Type | Description |
| --- | --- | --- |
| `getQuote`\* | <code>(params: </code><a href="#stakingquoteparams"><code>StakingQuoteParams</code></a><code>, providerId?: string) =&gt; Promise&lt;</code><a href="#stakingquote"><code>StakingQuote</code></a><code>&gt;</code> | Get a quote for staking or unstaking |
| `buildStakeTransaction`\* | <code>(params: </code><a href="#stakeparams"><code>StakeParams</code></a><code>, providerId?: string) =&gt; Promise&lt;</code><a href="#transactionrequest"><code>TransactionRequest</code></a><code>&gt;</code> | Build a transaction for staking |
| `getStakedBalance`\* | <code>(userAddress: </code><a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a><code>, network?: </code><a href="#network"><code>Network</code></a><code>, providerId?: string) =&gt; Promise&lt;</code><a href="#stakingbalance"><code>StakingBalance</code></a><code>&gt;</code> | Get user's staked balance |
| `getStakingProviderInfo`\* | <code>(network?: </code><a href="#network"><code>Network</code></a><code>, providerId?: string) =&gt; Promise&lt;</code><a href="#stakingproviderinfo"><code>StakingProviderInfo</code></a><code>&gt;</code> | Get staking provider information |
| `getStakingProviderMetadata`\* | <code>(network?: </code><a href="#network"><code>Network</code></a><code>, providerId?: string) =&gt; </code><a href="#stakingprovidermetadata"><code>StakingProviderMetadata</code></a> | Get static metadata for a staking provider |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |
| `registerProvider`\* | <code>(provider: </code><a href="#providerinput"><code>ProviderInput</code></a><code>&lt;StakingProviderInterface&gt;) =&gt; void</code> | Register a new provider. If a provider with the same id is already registered, it is replaced. |
| `removeProvider`\* | `(provider: StakingProviderInterface) => void` | Remove a previously registered provider. No-op if the provider was not registered. |
| `setDefaultProvider`\* | `(providerId: string) => void` | Set the default provider |
| `getProvider`\* | `(providerId?: string) => StakingProviderInterface` | Get a registered provider |
| `getProviders`\* | `() => Array<StakingProviderInterface>` | Get all registered providers. The returned array keeps a stable reference until the provider list changes. |
| `hasProvider`\* | `(providerId: string) => boolean` | Check if a provider is registered |

#### StakingBalance

Staking balance information for a user

| Field | Type | Description |
| --- | --- | --- |
| `rawStakedBalance`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount currently staked |
| `stakedBalance`\* | `string` | Amount currently staked |
| `rawInstantUnstakeAvailable`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount available for instant unstake |
| `instantUnstakeAvailable`\* | `string` | Amount available for instant unstake |
| `providerId`\* | `string` | Identifier of the staking provider |

#### StakingProviderInfo

Dynamic staking information for a provider

| Field | Type | Description |
| --- | --- | --- |
| `apy`\* | `number` | Annual Percentage Yield in basis points (100 = 1%) |
| `rawInstantUnstakeAvailable` | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount available for instant unstake |
| `instantUnstakeAvailable` | `string` | Amount available for instant unstake |
| `exchangeRate` | `string` | Exchange rate between stakeToken and receiveToken (e.g. 1 TON = 0.95 tsTON). Undefined when there is no receiveToken (direct/custodial staking). |

#### StakingProviderMetadata

Static metadata for a staking provider

| Field | Type | Description |
| --- | --- | --- |
| `name`\* | `string` | Human-readable provider name (e.g. "Tonstakers") |
| `supportedUnstakeModes`\* | <a href="#unstakemodes"><code>UnstakeModes</code></a><code>[]</code> | Supported unstake modes for this provider |
| `supportsReversedQuote`\* | `boolean` | Whether provider supports reversed quote format (e.g., passing TON instead of tsTON for unstake) |
| `stakeToken`\* | <a href="#stakingtokeninfo"><code>StakingTokenInfo</code></a> | Token that the user sends when staking (e.g. TON) |
| `receiveToken` | <a href="#stakingtokeninfo"><code>StakingTokenInfo</code></a> | Token that the user receives when staking (e.g. tsTON for liquid staking). Absent for direct/custodial staking. |
| `contractAddress` | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Provider contract address (optional — custodial providers may not have one) |

#### StakingQuote

Staking quote response with pricing information

| Field | Type | Description |
| --- | --- | --- |
| `direction`\* | <a href="#stakingquotedirection"><code>StakingQuoteDirection</code></a> | Direction of the quote (stake or unstake) |
| `rawAmountIn`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount of tokens being provided |
| `rawAmountOut`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Estimated amount of tokens to be received |
| `amountIn`\* | `string` | Formatted amount of tokens being provided |
| `amountOut`\* | `string` | Formatted estimated amount of tokens to be received |
| `network`\* | <a href="#network"><code>Network</code></a> | Network on which the staking will be executed |
| `providerId`\* | `string` | Identifier of the staking provider |
| `unstakeMode` | <a href="#unstakemodes"><code>UnstakeModes</code></a> | Mode of unstaking (if applicable) |
| `metadata` | `unknown` | Provider-specific metadata for the quote |

#### StakingQuoteDirection

Direction of the staking quote

```ts
type StakingQuoteDirection = 'stake' | 'unstake';
```

#### StakingQuoteParams

Parameters for getting a staking quote

| Field | Type | Description |
| --- | --- | --- |
| `direction`\* | <a href="#stakingquotedirection"><code>StakingQuoteDirection</code></a> | Direction of the quote (stake or unstake) |
| `amount`\* | `string` | Amount of tokens to stake or unstake |
| `userAddress` | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Address of the user |
| `network` | <a href="#network"><code>Network</code></a> | Network on which the staking will be executed |
| `unstakeMode` | <a href="#unstakemodes"><code>UnstakeModes</code></a> | Requested mode of unstaking |
| `isReversed` | `boolean` | If true, for unstake requests the amount is specified in the staking coin (e.g. TON) instead of the Liquid Staking Token (e.g. tsTON). |
| `providerOptions` | `TProviderOptions` | Provider-specific options |

#### StakingTokenInfo

_TODO: describe_

| Field | Type | Description |
| --- | --- | --- |
| `ticker`\* | `string` | _TODO: describe_ |
| `decimals`\* | `number` | _TODO: describe_ |
| `address`\* | `string` | 'ton' for native TON, otherwise contract address in friendly format |

#### UnstakeModes

Mode of unstaking

```ts
type UnstakeModes = (typeof UnstakeMode)[keyof typeof UnstakeMode];
```

### Swap

#### SwapAPI

Swap API interface exposed by SwapManager

| Field | Type | Description |
| --- | --- | --- |
| `getQuote`\* | <code>(params: </code><a href="#swapquoteparams"><code>SwapQuoteParams</code></a><code>, providerId?: string) =&gt; Promise&lt;</code><a href="#swapquote"><code>SwapQuote</code></a><code>&gt;</code> | Get a quote for swapping tokens |
| `buildSwapTransaction`\* | <code>(params: </code><a href="#swapparams"><code>SwapParams</code></a><code>) =&gt; Promise&lt;</code><a href="#transactionrequest"><code>TransactionRequest</code></a><code>&gt;</code> | Build a transaction for a swap. Provider is taken from `params.quote.providerId`, or the manager default. |
| `createFactoryContext`\* | `() => ProviderFactoryContext` | _TODO: describe_ |
| `registerProvider`\* | <code>(provider: </code><a href="#providerinput"><code>ProviderInput</code></a><code>&lt;SwapProviderInterface&lt;unknown, unknown&gt;&gt;) =&gt; void</code> | Register a new provider. If a provider with the same id is already registered, it is replaced. |
| `removeProvider`\* | `(provider: SwapProviderInterface<unknown, unknown>) => void` | Remove a previously registered provider. No-op if the provider was not registered. |
| `setDefaultProvider`\* | `(providerId: string) => void` | Set the default provider |
| `getProvider`\* | `(providerId?: string) => SwapProviderInterface<unknown, unknown>` | Get a registered provider |
| `getProviders`\* | `() => Array<SwapProviderInterface<unknown, unknown>>` | Get all registered providers. The returned array keeps a stable reference until the provider list changes. |
| `hasProvider`\* | `(providerId: string) => boolean` | Check if a provider is registered |

#### SwapParams

Parameters for building swap transaction

| Field | Type | Description |
| --- | --- | --- |
| `quote`\* | <a href="#swapquote"><code>SwapQuote</code></a> | The swap quote based on which the transaction is built |
| `userAddress`\* | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Address of the user performing the swap |
| `destinationAddress` | <a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Address to receive the swapped tokens (defaults to userAddress) |
| `slippageBps` | `number` | Slippage tolerance in basis points (1 bp = 0.01%) |
| `deadline` | `number` | Transaction deadline in unix timestamp |
| `providerOptions` | `TProviderOptions` | Provider-specific options |

#### SwapQuote

Swap quote response with pricing information

| Field | Type | Description |
| --- | --- | --- |
| `fromToken`\* | <a href="#swaptoken"><code>SwapToken</code></a> | Token being sold |
| `toToken`\* | <a href="#swaptoken"><code>SwapToken</code></a> | Token being bought |
| `rawFromAmount`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount of tokens to sell |
| `rawToAmount`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount of tokens to buy |
| `fromAmount`\* | `string` | Amount of tokens to sell |
| `toAmount`\* | `string` | Amount of tokens to buy |
| `rawMinReceived`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Minimum amount of tokens to receive (after slippage) |
| `minReceived`\* | `string` | Minimum amount of tokens to receive (after slippage) |
| `network`\* | <a href="#network"><code>Network</code></a> | Network on which the swap will be executed |
| `priceImpact` | `number` | Price impact of the swap in basis points (100 = 1%) |
| `providerId`\* | `string` | Identifier of the swap provider |
| `expiresAt` | `number` | Unix timestamp in seconds when the quote expires |
| `metadata` | `unknown` | Provider-specific metadata for the quote |

#### SwapQuoteParams

Base parameters for requesting a swap quote

| Field | Type | Description |
| --- | --- | --- |
| `amount`\* | `string` | Amount of tokens to swap (incoming or outgoing depending on isReverseSwap) |
| `from`\* | <a href="#swaptoken"><code>SwapToken</code></a> | Token to swap from |
| `to`\* | <a href="#swaptoken"><code>SwapToken</code></a> | Token to swap to |
| `network`\* | <a href="#network"><code>Network</code></a> | Network on which the swap will be executed |
| `slippageBps` | `number` | Slippage tolerance in basis points (1 bp = 0.01%) |
| `maxOutgoingMessages` | `number` | Maximum number of outgoing messages |
| `providerOptions` | `TProviderOptions` | Provider-specific options |
| `isReverseSwap` | `boolean` | If true, amount is the amount to receive (buy). If false, amount is the amount to spend (sell). |

#### SwapToken

Token type for swap

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string` | _TODO: describe_ |
| `decimals`\* | `number` | _TODO: describe_ |
| `name` | `string` | _TODO: describe_ |
| `symbol` | `string` | _TODO: describe_ |
| `image` | `string` | _TODO: describe_ |
| `chainId` | `string` | _TODO: describe_ |

### Transactions

#### SendTransactionResponse

Wallet response carrying the BoC (bag of cells) of the external message that was signed and broadcast — used to track or hash the resulting transaction.

| Field | Type | Description |
| --- | --- | --- |
| `boc`\* | <a href="#base64string"><code>Base64String</code></a> | BOC of the sent transaction |
| `normalizedBoc`\* | <a href="#base64string"><code>Base64String</code></a> | Normalized BOC of the external-in message |
| `normalizedHash`\* | <a href="#hex"><code>Hex</code></a> | Hash of the normalized external-in message |

#### TransactionRequest

Transaction payload passed to [`WalletInterface`](#walletinterface)`.sendTransaction` — one or more messages, optional network override and `validUntil` deadline.

| Field | Type | Description |
| --- | --- | --- |
| `messages`\* | <a href="#transactionrequestmessage"><code>TransactionRequestMessage</code></a><code>[]</code> | List of messages to include in the transaction |
| `network` | <a href="#network"><code>Network</code></a> | Network to execute the transaction on |
| `validUntil` | `number` | Unix timestamp after which the transaction becomes invalid |
| `fromAddress` | `string` | Sender wallet address in received format(raw, user friendly) |

#### TransactionRequestMessage

Individual message inside a [`TransactionRequest`](#transactionrequest) — recipient, amount, optional payload and contract `stateInit`.

| Field | Type | Description |
| --- | --- | --- |
| `address`\* | `string` | Recipient wallet address in format received from caller (raw, user friendly) |
| `amount`\* | <a href="#tokenamount"><code>TokenAmount</code></a> | Amount to transfer in nanos |
| `extraCurrency` | <a href="#extracurrencies"><code>ExtraCurrencies</code></a> | Additional currencies to include in the transfer |
| `stateInit` | `string` | Initial state for deploying a new contract, encoded in Base64 |
| `payload` | `string` | Message payload data encoded in Base64 |

### Wallets

#### WalletInterface

Wallet contract surfaced by every [`Connector`](#connector) — covers identity (address, public key, network) and signing operations; reads (balance, jettons, NFTs) go through AppKit actions instead.

| Field | Type | Description |
| --- | --- | --- |
| `connectorId`\* | `string` | Id of the [`Connector`](#connector) that produced this wallet. |
| `getAddress`\* | <code>() =&gt; </code><a href="#userfriendlyaddress"><code>UserFriendlyAddress</code></a> | Wallet address as a user-friendly base64url string. |
| `getPublicKey`\* | <code>() =&gt; </code><a href="#hex"><code>Hex</code></a> | Wallet public key as a `0x`-prefixed hex string. |
| `getNetwork`\* | <code>() =&gt; </code><a href="#network"><code>Network</code></a> | Network the wallet is currently connected to. |
| `getWalletId`\* | `() => string` | Stable identifier combining address and network — unique across AppKit's connected wallets. |
| `sendTransaction`\* | <code>(request: </code><a href="#transactionrequest"><code>TransactionRequest</code></a><code>) =&gt; Promise&lt;</code><a href="#sendtransactionresponse"><code>SendTransactionResponse</code></a><code>&gt;</code> | Send a transaction — the wallet signs and broadcasts it. |
| `signData`\* | <code>(payload: </code><a href="#signdatarequest"><code>SignDataRequest</code></a><code>) =&gt; Promise&lt;</code><a href="#signdataresponse"><code>SignDataResponse</code></a><code>&gt;</code> | Sign arbitrary data via the TonConnect signData flow. |

## Constants

### Connectors

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

### Staking

#### StakingErrorCode

Discriminator carried on every [`StakingError`](#stakingerror)`.code` — `'INVALID_PARAMS'` (the request was malformed) or `'UNSUPPORTED_OPERATION'` (the provider doesn't support this call).

| Field | Type | Description |
| --- | --- | --- |
| `InvalidParams`\* | `"INVALID_PARAMS"` | _TODO: describe_ |
| `UnsupportedOperation`\* | `"UNSUPPORTED_OPERATION"` | _TODO: describe_ |

#### UnstakeMode

_TODO: describe_

```ts
const UnstakeMode = { readonly INSTANT: "INSTANT"; readonly WHEN_AVAILABLE: "WHEN_AVAILABLE"; readonly ROUND_END: "ROUND_END"; };
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
