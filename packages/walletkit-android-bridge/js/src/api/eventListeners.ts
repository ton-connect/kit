/**
 * Shared event listener references used to manage WalletKit callbacks.
 */
export type BridgeEventListener = ((event: unknown) => void) | null;

export const eventListeners = {
  onConnectListener: null as BridgeEventListener,
  onTransactionListener: null as BridgeEventListener,
  onSignDataListener: null as BridgeEventListener,
  onDisconnectListener: null as BridgeEventListener,
};
