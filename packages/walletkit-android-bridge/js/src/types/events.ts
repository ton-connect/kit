/**
 * WalletKit bridge event primitives shared between the native layer and the JS bridge.
 */
export type WalletKitBridgeEventType =
  | 'ready'
  | 'connectRequest'
  | 'transactionRequest'
  | 'signDataRequest'
  | 'disconnect'
  | 'signerSignRequest'
  | 'browserPageStarted'
  | 'browserPageFinished'
  | 'browserError'
  | 'browserBridgeRequest'
  | (string & {});

export interface WalletKitBridgeEvent<T = unknown> {
  type: WalletKitBridgeEventType;
  data?: T;
}

export type WalletKitBridgeEventHandler = (event: WalletKitBridgeEvent) => void;

export type WalletKitBridgeEventCallback = (
  type: WalletKitBridgeEventType,
  event: WalletKitBridgeEvent['data'],
) => void;
