/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Cryptographic helpers backed by WalletKit and custom signer coordination.
 *
 * Note: Array.from() conversions for Uint8Array → number[] are necessary glue code.
 * JSON.stringify cannot serialize Uint8Array, so we must convert to number arrays
 * for RPC communication between JS and Kotlin layers.
 */
import type { MnemonicToKeyPairArgs, SignArgs, CreateTonMnemonicArgs } from '../types';
import { CreateTonMnemonic, MnemonicToKeyPair, DefaultSignature } from '../core/moduleLoader';
import { hexToBytes, bytesToHex, normalizeHex } from '../utils/serialization';
import { callBridge } from '../utils/bridgeWrapper';

type SignerRequestHandler = {
    resolve: (signature: string) => void;
    reject: (error: Error) => void;
};

type SignerRequestMap = Map<string, SignerRequestHandler>;

type WalletKitSignerRegistry = Map<string, SignerRequestMap>;

type WalletKitGlobal = typeof globalThis & {
    __walletKitSignerRequests?: WalletKitSignerRegistry;
};

const walletKitGlobal = globalThis as WalletKitGlobal;

/**
 * Converts a mnemonic phrase to a key pair (public + secret keys).
 *
 * @param args - Mnemonic words and optional type ('ton' or 'bip39').
 */
export async function mnemonicToKeyPair(args: MnemonicToKeyPairArgs) {
    return callBridge('mnemonicToKeyPair', async () => {
        const mnemonicToKeyPairFn = requireModule(MnemonicToKeyPair, 'MnemonicToKeyPair');
        const keyPair = await mnemonicToKeyPairFn(args.mnemonic, args.mnemonicType ?? 'ton');

        return {
            publicKey: Array.from(keyPair.publicKey) as number[],
            secretKey: Array.from(keyPair.secretKey) as number[],
        };
    });
}

/**
 * Signs arbitrary data using a secret key.
 *
 * @param args - Data bytes and secret key bytes.
 */
export async function sign(args: SignArgs) {
    return callBridge('sign', async () => {
        if (!Array.isArray(args.data)) {
            throw new Error('Data array required for sign');
        }
        if (!Array.isArray(args.secretKey)) {
            throw new Error('Secret key array required for sign');
        }

        const dataBytes = Uint8Array.from(args.data);
        const secretKeyBytes = Uint8Array.from(args.secretKey);

        // DefaultSignature returns hex string
        const signatureFn = requireModule(DefaultSignature, 'DefaultSignature');
        const signatureHex = signatureFn(dataBytes, secretKeyBytes);

        // Convert hex to bytes for consistent return format
        const signatureBytes = hexToBytes(signatureHex);

        return { signature: Array.from(signatureBytes) as number[] };
    });
}

/**
 * Generates a TON mnemonic phrase.
 *
 * @param _args - Optional generation parameters.
 */
export async function createTonMnemonic(_args: CreateTonMnemonicArgs = { count: 24 }) {
    return callBridge('createTonMnemonic', async () => {
        const createTonMnemonicFn = requireModule(CreateTonMnemonic, 'CreateTonMnemonic');
        const mnemonicResult = await createTonMnemonicFn();
        const words = Array.isArray(mnemonicResult) ? mnemonicResult : `${mnemonicResult}`.split(' ').filter(Boolean);
        return { items: words };
    });
}

function requireModule<T>(moduleRef: T | null, name: string): T {
    if (!moduleRef) {
        throw new Error(`${name} is not available`);
    }
    return moduleRef;
}
