---
target: packages/appkit/docs/actions.md
---

# Actions

AppKit provides a set of actions to interact with the blockchain and wallets.

## Balances

### `getBalance`

Get the TON balance of the currently selected wallet.

%%demo/examples/src/appkit/actions/balances#GET_BALANCE%%

### `getBalanceByAddress`

Fetch the TON balance of a specific address.

%%demo/examples/src/appkit/actions/balances#GET_BALANCE_BY_ADDRESS%%

## Connectors

### `connect`

Connect a wallet using a specific connector.

%%demo/examples/src/appkit/actions/connectors#CONNECT%%

### `disconnect`

Disconnect a wallet using a specific connector.

%%demo/examples/src/appkit/actions/connectors#DISCONNECT%%

### `getConnectors`

Get all available connectors.

%%demo/examples/src/appkit/actions/connectors#GET_CONNECTORS%%

### `getConnectorById`

Get a specific connector by its ID.

%%demo/examples/src/appkit/actions/connectors#GET_CONNECTOR_BY_ID%%

### `watchConnectors`

Watch for changes in available connectors (e.g., when a wallet connects).

%%demo/examples/src/appkit/actions/connectors#WATCH_CONNECTORS%%

### `watchConnectorById`

Watch for changes in a specific connector.

%%demo/examples/src/appkit/actions/connectors#WATCH_CONNECTOR_BY_ID%%
