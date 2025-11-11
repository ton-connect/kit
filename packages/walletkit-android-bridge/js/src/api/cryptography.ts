/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cryptographic helpers backed by WalletKit and custom signer coordination.
 */
import type {
    DerivePublicKeyFromMnemonicArgs,
    SignDataWithMnemonicArgs,
    CreateTonMnemonicArgs,
    RespondToSignRequestArgs,
    CallContext,
} from '../types';
import { ensureWalletKitLoaded, Signer, CreateTonMnemonic } from '../core/moduleLoader';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { hexToBytes, bytesToHex, normalizeHex } from '../utils/serialization';
import { emit } from '../transport/messaging';

/**
 * Derives the public key from a mnemonic phrase using WalletKit's signer implementation.
 *
 * @param args - Mnemonic words used for derivation.
 * @param context - Diagnostic context for tracing.
 */
export async function derivePublicKeyFromMnemonic(args: DerivePublicKeyFromMnemonicArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'derivePublicKeyFromMnemonic:start');
    await ensureWalletKitLoaded();

    const signer = await Signer.fromMnemonic(args.mnemonic, { type: 'ton' });

    emitCallCheckpoint(context, 'derivePublicKeyFromMnemonic:complete');
    return { publicKey: signer.publicKey };
}

/**
 * Signs arbitrary data using a mnemonic phrase.
 *
 * @param args - Mnemonic words, payload bytes, and optional mnemonic type.
 * @param context - Diagnostic context for tracing.
 */
export async function signDataWithMnemonic(args: SignDataWithMnemonicArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'signDataWithMnemonic:before-ensureWalletKitLoaded');
    await ensureWalletKitLoaded();
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-ensureWalletKitLoaded');

    if (!args?.words || args.words.length === 0) {
        throw new Error('Mnemonic words required for signDataWithMnemonic');
    }
    if (!Array.isArray(args.data)) {
        throw new Error('Data array required for signDataWithMnemonic');
    }

    const signer = await Signer.fromMnemonic(args.words, { type: args.mnemonicType ?? 'ton' });
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-createSigner');

    const dataBytes = Uint8Array.from(args.data);
    const signatureResult = await signer.sign(dataBytes);
    emitCallCheckpoint(context, 'signDataWithMnemonic:after-sign');

    let signatureBytes: Uint8Array;
    if (typeof signatureResult === 'string') {
        signatureBytes = hexToBytes(signatureResult);
    } else if (signatureResult instanceof Uint8Array) {
        signatureBytes = signatureResult;
    } else if (Array.isArray(signatureResult)) {
        signatureBytes = Uint8Array.from(signatureResult);
    } else {
        throw new Error('Unsupported signature format from signer');
    }

    return { signature: Array.from(signatureBytes) };
}

/**
 * Generates a TON mnemonic phrase.
 *
 * @param _args - Optional generation parameters.
 * @param context - Diagnostic context for tracing.
 */
export async function createTonMnemonic(_args: CreateTonMnemonicArgs = { count: 24 }, context?: CallContext) {
    emitCallCheckpoint(context, 'createTonMnemonic:start');
    await ensureWalletKitLoaded();
    const mnemonicResult = await CreateTonMnemonic();
    const words = Array.isArray(mnemonicResult) ? mnemonicResult : `${mnemonicResult}`.split(' ').filter(Boolean);
    emitCallCheckpoint(context, 'createTonMnemonic:complete');
    return { items: words };
}

/**
 * Resolves a pending signer request, delivering either a signature or an error.
 *
 * @param args - Response payload from the native side.
 */
export async function respondToSignRequest(args: RespondToSignRequestArgs, _context?: CallContext) {
    const signerRequests = (globalThis as any).__walletKitSignerRequests?.get(args.signerId);
    if (!signerRequests) {
        throw new Error('Unknown signer ID: ${args.signerId}');
    }

    const pending = signerRequests.get(args.requestId);
    if (!pending) {
        throw new Error('Unknown sign request ID: ${args.requestId}');
    }

    signerRequests.delete(args.requestId);

    if (args.error) {
        pending.reject(new Error(args.error));
    } else if (typeof args.signature === 'string') {
        pending.resolve(normalizeHex(args.signature));
    } else if (Array.isArray(args.signature)) {
        const signatureHex = bytesToHex(new Uint8Array(args.signature));
        pending.resolve(signatureHex);
    } else {
        pending.reject(new Error('No signature or error provided'));
    }

    return { ok: true };
}

/**
 * Registers a map of pending signer requests keyed by signer identifier.
 *
 * @param signerId - Unique signer identifier provided by the native layer.
 * @param pendingSignRequests - Resolver map awaiting signature responses.
 */
export function registerSignerRequest(
    signerId: string,
    pendingSignRequests: Map<string, { resolve: (sig: Uint8Array) => void; reject: (err: Error) => void }>,
) {
    if (!(globalThis as any).__walletKitSignerRequests) {
        (globalThis as any).__walletKitSignerRequests = new Map();
    }
    (globalThis as any).__walletKitSignerRequests.set(signerId, pendingSignRequests);
}

/**
 * Emits a signer request event so the native layer can provide a signature.
 *
 * @param signerId - Signer identifier.
 * @param requestId - Unique request identifier.
 * @param data - Raw bytes that require signing.
 */
export function emitSignerRequest(signerId: string, requestId: string, data: Uint8Array) {
    emit('signerSignRequest', {
        signerId,
        requestId,
        data: Array.from(data),
    });
}
