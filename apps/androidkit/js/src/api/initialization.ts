/**
 * Initialization and event listener management for the Android WalletKit bridge.
 */
import type { WalletKitBridgeInitConfig, CallContext, SetEventsListenersArgs } from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { initTonWalletKit, requireWalletKit } from '../core/initialization';
import { walletKit } from '../core/state';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { emit } from '../transport/messaging';
import { postToNative } from '../transport/nativeBridge';
import { eventListeners } from './eventListeners';
import { AndroidStorageAdapter } from '../adapters/AndroidStorageAdapter';

/**
 * Sets up WalletKit with the provided configuration and ensures dependencies are loaded.
 *
 * @param config - Optional WalletKit configuration provided by the native layer.
 * @param context - Diagnostic context used to emit bridge checkpoints.
 */
export async function init(config?: WalletKitBridgeInitConfig, context?: CallContext) {
  emitCallCheckpoint(context, 'init:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'init:after-ensureWalletKitLoaded');
  emitCallCheckpoint(context, 'init:before-initTonWalletKit');
  const result = await initTonWalletKit(config, context, {
    emitCallCheckpoint,
    emit,
    postToNative,
    AndroidStorageAdapter,
  });
  emitCallCheckpoint(context, 'init:after-initTonWalletKit');
  return result;
}

/**
 * Registers bridge event listeners, proxying WalletKit events back to the native layer.
 *
 * @param args - Optional callback wrapper supplied by the native bridge.
 * @param context - Diagnostic context used to emit checkpoints.
 */
export function setEventsListeners(args?: SetEventsListenersArgs, context?: CallContext) {
  emitCallCheckpoint(context, 'setEventsListeners:enter');
  requireWalletKit();
  console.log('[walletkitBridge] 🔔 Setting up event listeners');

  const callback =
    args?.callback ||
    ((type: string, event: any) => {
      emit(type as any, event);
    });

  if (eventListeners.onConnectListener) {
    walletKit.removeConnectRequestCallback();
  }

  eventListeners.onConnectListener = (event: any) => {
    console.log('[walletkitBridge] 📨 Connect request received');
    callback('connectRequest', event);
  };

  walletKit.onConnectRequest(eventListeners.onConnectListener);
  console.log('[walletkitBridge] ✅ Connect listener registered');

  if (eventListeners.onTransactionListener) {
    walletKit.removeTransactionRequestCallback();
  }

  eventListeners.onTransactionListener = (event: any) => {
    console.log('[walletkitBridge] 📨 Transaction request received');
    callback('transactionRequest', event);
  };

  console.log('[walletkitBridge] About to call walletKit.onTransactionRequest...');
  walletKit.onTransactionRequest(eventListeners.onTransactionListener);
  console.log('[walletkitBridge] ✅ Transaction listener registered');

  if (eventListeners.onSignDataListener) {
    walletKit.removeSignDataRequestCallback();
  }

  eventListeners.onSignDataListener = (event: any) => {
    console.log('[walletkitBridge] 📨 Sign data request received');
    callback('signDataRequest', event);
  };

  console.log('[walletkitBridge] About to call walletKit.onSignDataRequest...');
  walletKit.onSignDataRequest(eventListeners.onSignDataListener);
  console.log('[walletkitBridge] ✅ Sign data listener registered');

  if (eventListeners.onDisconnectListener) {
    walletKit.removeDisconnectCallback();
  }

  eventListeners.onDisconnectListener = (event: any) => {
    console.log('[walletkitBridge] 📨 Disconnect event received');
    callback('disconnect', event);
  };

  walletKit.onDisconnect(eventListeners.onDisconnectListener);
  console.log('[walletkitBridge] ✅ Disconnect listener registered');

  console.log('[walletkitBridge] ✅ Event listeners set up successfully');
  return { ok: true };
}

/**
 * Removes all previously registered bridge event listeners.
 *
 * @param _args - Unused placeholder to preserve call signature compatibility.
 * @param context - Diagnostic context used to emit checkpoints.
 */
export function removeEventListeners(_?: unknown, context?: CallContext) {
  emitCallCheckpoint(context, 'removeEventListeners:enter');
  requireWalletKit();
  console.log('[walletkitBridge] 🗑️ Removing all event listeners');

  if (eventListeners.onConnectListener) {
    walletKit.removeConnectRequestCallback();
    eventListeners.onConnectListener = null;
  }

  if (eventListeners.onTransactionListener) {
    walletKit.removeTransactionRequestCallback();
    eventListeners.onTransactionListener = null;
  }

  if (eventListeners.onSignDataListener) {
    walletKit.removeSignDataRequestCallback();
    eventListeners.onSignDataListener = null;
  }

  if (eventListeners.onDisconnectListener) {
    walletKit.removeDisconnectCallback();
    eventListeners.onDisconnectListener = null;
  }

  console.log('[walletkitBridge] ✅ All event listeners removed');
  return { ok: true };
}
