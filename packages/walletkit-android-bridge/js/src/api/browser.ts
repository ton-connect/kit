/**
 * Internal browser events dispatched back to the native layer.
 */
import type {
  EmitBrowserPageArgs,
  EmitBrowserErrorArgs,
  EmitBrowserBridgeRequestArgs,
} from '../types';
import { emit } from '../transport/messaging';

/**
 * Signals that the internal browser started loading a page.
 *
 * @param args - Page metadata.
 */
export function emitBrowserPageStarted(args: EmitBrowserPageArgs) {
  emit('browserPageStarted', { url: args.url });
  return { success: true };
}

/**
 * Signals that the internal browser finished loading a page.
 *
 * @param args - Page metadata.
 */
export function emitBrowserPageFinished(args: EmitBrowserPageArgs) {
  emit('browserPageFinished', { url: args.url });
  return { success: true };
}

/**
 * Reports a browser error to the native layer.
 *
 * @param args - Error details.
 */
export function emitBrowserError(args: EmitBrowserErrorArgs) {
  emit('browserError', { message: args.message });
  return { success: true };
}

/**
 * Emits a TonConnect bridge request originating in the internal browser.
 *
 * @param args - Request metadata for analytics/UI.
 */
export function emitBrowserBridgeRequest(args: EmitBrowserBridgeRequestArgs) {
  emit('browserBridgeRequest', {
    messageId: args.messageId,
    method: args.method,
    request: args.request,
  });
  return { success: true };
}
