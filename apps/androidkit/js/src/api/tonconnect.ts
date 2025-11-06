/**
 * TonConnect helpers covering URL handling, session lifecycle, and injected bridge requests.
 */
import type {
  HandleTonConnectUrlArgs,
  CallContext,
  DisconnectSessionArgs,
  ProcessInternalBrowserRequestArgs,
} from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { walletKit } from '../core/state';
import { requireWalletKit } from '../core/initialization';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { resolveTonConnectUrl } from '../utils/parsing';
import { serializeDate } from '../utils/serialization';
import { postToNative } from '../transport/nativeBridge';

/**
 * Handles TonConnect URLs originating from deep links or QR codes.
 *
 * @param args - Raw argument provided by the native layer.
 * @param context - Diagnostic context for tracing.
 */
export async function handleTonConnectUrl(args: HandleTonConnectUrlArgs, context?: CallContext) {
  console.log('[walletkitBridge] handleTonConnectUrl called with args:', args);
  emitCallCheckpoint(context, 'handleTonConnectUrl:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'handleTonConnectUrl:after-ensureWalletKitLoaded');
  requireWalletKit();
  emitCallCheckpoint(context, 'handleTonConnectUrl:after-requireWalletKit');
  const url = resolveTonConnectUrl(args);
  console.log('[walletkitBridge] resolved URL:', url);
  if (!url) {
    throw new Error('TON Connect URL is missing');
  }
  console.log('[walletkitBridge] calling walletKit.handleTonConnectUrl with:', url);
  try {
    const result = await walletKit.handleTonConnectUrl(url);
    console.log('[walletkitBridge] handleTonConnectUrl result:', result);
    return result;
  } catch (err) {
    console.error('[walletkitBridge] handleTonConnectUrl error:', err);
    console.error('[walletkitBridge] error type:', typeof err);
    console.error('[walletkitBridge] error message:', err instanceof Error ? err.message : String(err));
    console.error('[walletkitBridge] error stack:', err instanceof Error ? err.stack : 'no stack');
    throw err;
  }
}

/**
 * Retrieves active TonConnect sessions and normalizes their metadata.
 *
 * @param _args - Unused placeholder to preserve compatibility.
 * @param context - Diagnostic context for tracing.
 */
export async function listSessions(_?: unknown, context?: CallContext) {
  emitCallCheckpoint(context, 'listSessions:enter');
  requireWalletKit();
  let sessions: any[] = [];
  if (typeof walletKit.listSessions === 'function') {
    emitCallCheckpoint(context, 'listSessions:before-walletKit.listSessions');
    try {
      sessions = (await walletKit.listSessions()) ?? [];
      console.log('[walletkitBridge] listSessions raw result:', sessions);
      console.log('[walletkitBridge] listSessions count:', sessions.length);
    } catch (error) {
      console.error('[walletkitBridge] walletKit.listSessions failed', error);
      throw error;
    }
    emitCallCheckpoint(context, 'listSessions:after-walletKit.listSessions');
  } else {
    console.warn('[walletkitBridge] walletKit.listSessions is not a function');
  }
  const items = sessions.map((session: any) => {
    const sessionId = session.sessionId || session.id;
    const mapped = {
      sessionId,
      dAppName: session.dAppName || session.name || '',
      walletAddress: session.walletAddress,
      dAppUrl: session.dAppUrl || session.url || null,
      manifestUrl: session.manifestUrl || null,
      iconUrl: session.dAppIconUrl || session.iconUrl || null,
      createdAt: serializeDate(session.createdAt),
      lastActivity: serializeDate(session.lastActivity),
    };
    console.log('[walletkitBridge] Mapped session:', JSON.stringify(mapped));
    return mapped;
  });
  console.log('[walletkitBridge] Returning items count:', items.length);
  return { items };
}

/**
 * Disconnects a TonConnect session by identifier.
 *
 * @param args - Optional session identifier to disconnect.
 * @param context - Diagnostic context for tracing.
 */
export async function disconnectSession(args?: DisconnectSessionArgs, context?: CallContext) {
  emitCallCheckpoint(context, 'disconnectSession:before-ensureWalletKitLoaded');
  await ensureWalletKitLoaded();
  emitCallCheckpoint(context, 'disconnectSession:after-ensureWalletKitLoaded');
  requireWalletKit();
  if (typeof walletKit.disconnect !== 'function') {
    throw new Error('walletKit.disconnect is not available');
  }
  emitCallCheckpoint(context, 'disconnectSession:before-walletKit.disconnect');
  await walletKit.disconnect(args?.sessionId);
  emitCallCheckpoint(context, 'disconnectSession:after-walletKit.disconnect');
  return { ok: true };
}

/**
 * Processes requests coming from the in-app browser TonConnect bridge.
 *
 * @param args - Bridge request payload from the native WebView.
 * @param context - Diagnostic context for tracing.
 */
export async function processInternalBrowserRequest(
  args: ProcessInternalBrowserRequestArgs,
  context?: CallContext,
) {
  emitCallCheckpoint(context, 'processInternalBrowserRequest:start');
  await ensureWalletKitLoaded();
  requireWalletKit();

  console.log('[walletkitBridge] ========== FULL ARGS ==========');
  console.log('[walletkitBridge] args keys:', Object.keys(args));
  console.log('[walletkitBridge] args.from:', args.from);
  console.log('[walletkitBridge] args.url:', args.url);
  console.log('[walletkitBridge] args:', JSON.stringify(args, null, 2));
  console.log('[walletkitBridge] ================================');
  console.log('[walletkitBridge] Processing internal browser request:', args.method, args.messageId);

  if (typeof walletKit.processInjectedBridgeRequest !== 'function') {
    throw new Error('walletKit.processInjectedBridgeRequest is not available');
  }

  let actualDomain = 'internal-browser';
  if (args.url) {
    try {
      const dappUrl = new URL(args.url);
      actualDomain = dappUrl.hostname;
      console.log('[walletkitBridge] ✅ Domain extracted from dApp URL:', actualDomain);
    } catch (e) {
      console.log('[walletkitBridge] ⚠️ Failed to parse dApp URL, using fallback:', e);
    }
  } else {
    console.log('[walletkitBridge] ⚠️ No dApp URL provided by Kotlin, using fallback');
  }

  console.log('[walletkitBridge] Resolved domain for signature:', actualDomain);

  const messageInfo = {
    messageId: args.messageId,
    tabId: args.messageId,
    domain: actualDomain,
  };

  const finalParams = args.params;

  if (
    args.method === 'connect' &&
    args.manifestUrl &&
    finalParams &&
    typeof finalParams === 'object' &&
    !Array.isArray(finalParams)
  ) {
    const paramsObj = finalParams as Record<string, unknown>;
    const hasManifestUrl =
      paramsObj.manifestUrl ||
      (paramsObj.manifest &&
        typeof paramsObj.manifest === 'object' &&
        (paramsObj.manifest as Record<string, unknown>).url);

    if (!hasManifestUrl) {
      console.log('[walletkitBridge] Injecting manifestUrl into connect params:', args.manifestUrl);
      paramsObj.manifestUrl = args.manifestUrl;
    }
  }

  const request: Record<string, unknown> = {
    id: args.messageId,
    method: args.method,
    params: finalParams,
  };

  console.log('[walletkitBridge] ========== INJECTED BRIDGE REQUEST ==========');
  console.log('[walletkitBridge] method:', args.method);
  console.log('[walletkitBridge] Omitting from field - wallet will generate session ID');
  console.log('[walletkitBridge] Original params type:', typeof args.params, 'isArray:', Array.isArray(args.params));
  console.log('[walletkitBridge] ==============================================');

  console.log('[walletkitBridge] ========== FORWARDING TO processInjectedBridgeRequest ==========');
  console.log('[walletkitBridge] messageInfo:', JSON.stringify(messageInfo, null, 2));
  console.log('[walletkitBridge] request:', JSON.stringify(request, null, 2));
  console.log('[walletkitBridge] request.params type:', typeof request.params);
  console.log('[walletkitBridge] request.params is Array?:', Array.isArray(request.params));
  console.log('[walletkitBridge] ================================================================');

  emitCallCheckpoint(context, 'processInternalBrowserRequest:before-processInjectedBridgeRequest');
  await walletKit.processInjectedBridgeRequest(messageInfo, request);
  emitCallCheckpoint(context, 'processInternalBridgeRequest:after-processInjectedBridgeRequest');

  console.log('[walletkitBridge] ⏳ Response will be provided by jsBridgeTransport');

  const responsePromise = new Promise<any>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout: ${args.messageId}`));
    }, 60000);

    if (!(globalThis as any).__internalBrowserResponseResolvers) {
      (globalThis as any).__internalBrowserResponseResolvers = new Map();
    }
    (globalThis as any).__internalBrowserResponseResolvers.set(args.messageId, {
      resolve: (response: any) => {
        clearTimeout(timeoutId);
        resolve(response);
      },
      reject: (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    });
  });

  console.log('[walletkitBridge] ⏳ Awaiting response from jsBridgeTransport...');
  const response = await responsePromise;
  console.log('[walletkitBridge] ✅ Received response from jsBridgeTransport:', response);
  console.log('[walletkitBridge] ✅ Response type:', typeof response);
  console.log('[walletkitBridge] ✅ Response keys:', Object.keys(response || {}));
  console.log('[walletkitBridge] ✅ Response.payload:', response?.payload);

  const result = response.payload || response;
  console.log('[walletkitBridge] ✅ Returning to Kotlin:', result);
  return result;
}
