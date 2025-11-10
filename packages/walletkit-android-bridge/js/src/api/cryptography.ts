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
    MnemonicToKeyPairArgs,
    SignArgs,
    CreateTonMnemonicArgs,
    RespondToSignRequestArgs,
    CallContext,
} from '../types';
import { ensureWalletKitLoaded, Signer, CreateTonMnemonic, MnemonicToKeyPair, DefaultSignature } from '../core/moduleLoader';
import { emitCallCheckpoint } from '../transport/diagnostics';
import { hexToBytes, bytesToHex, normalizeHex } from '../utils/serialization';
import { emit } from '../transport/messaging';

/**
 * Converts a mnemonic phrase to a key pair (public + secret keys).
 *
 * @param args - Mnemonic words and optional type ('ton' or 'bip39').
 * @param context - Diagnostic context for tracing.
 */
export async function mnemonicToKeyPair(args: MnemonicToKeyPairArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'mnemonicToKeyPair:start');
    await ensureWalletKitLoaded();

    const keyPair = await MnemonicToKeyPair(args.mnemonic, args.mnemonicType ?? 'ton');

    emitCallCheckpoint(context, 'mnemonicToKeyPair:complete');
    return {
        publicKey: Array.from(keyPair.publicKey) as number[],
        secretKey: Array.from(keyPair.secretKey) as number[],
    };
}

/**
 * Signs arbitrary data using a secret key.
 *
 * @param args - Data bytes and secret key bytes.
 * @param context - Diagnostic context for tracing.
 */
export async function sign(args: SignArgs, context?: CallContext) {
    emitCallCheckpoint(context, 'sign:start');
    await ensureWalletKitLoaded();

    if (!Array.isArray(args.data)) {
        throw new Error('Data array required for sign');
    }
    if (!Array.isArray(args.secretKey)) {
        throw new Error('Secret key array required for sign');
    }

    const dataBytes = Uint8Array.from(args.data);
    const secretKeyBytes = Uint8Array.from(args.secretKey);

    // DefaultSignature returns hex string
    const signatureHex = DefaultSignature(dataBytes, secretKeyBytes);
    
    // Convert hex to bytes for consistent return format
    const signatureBytes = hexToBytes(signatureHex);

    emitCallCheckpoint(context, 'sign:complete');
    return { signature: Array.from(signatureBytes) as number[] };
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
