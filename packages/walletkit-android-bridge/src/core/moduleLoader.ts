/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Lazy module loader for WalletKit and TON core primitives.
 */
import type { WalletKitInstance, WalletKitAdapter, WalletKitSigner } from '../types';

const walletKitModulePromise = import('@ton/walletkit');

type TonWalletKitConstructor = new (options: Record<string, unknown>) => WalletKitInstance;

type SignerFactory = {
    fromMnemonic: (mnemonic: string[], options: { type: string }) => Promise<WalletKitSigner>;
    fromPrivateKey: (secretKey: string) => Promise<WalletKitSigner>;
};

type AdapterFactory = {
    create: (signer: WalletKitSigner, options: Record<string, unknown>) => Promise<WalletKitAdapter>;
};

type WalletKitModule = {
    TonWalletKit: TonWalletKitConstructor;
    CreateTonMnemonic?: () => Promise<string[]>;
    MnemonicToKeyPair?: (
        mnemonic: string[],
        type: string,
    ) => Promise<{
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    }>;
    Signer?: SignerFactory;
    DefaultSignature?: (data: Uint8Array, secretKey: Uint8Array) => string;
    WalletV4R2Adapter?: AdapterFactory;
    WalletV5R1Adapter?: AdapterFactory;
};

export let TonWalletKit: TonWalletKitConstructor | null = null;
export let CreateTonMnemonic: (() => Promise<string[]>) | null = null;
export let MnemonicToKeyPair:
    | ((mnemonic: string[], type: string) => Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }>)
    | null = null;
export let Signer: SignerFactory | null = null;
export let DefaultSignature: ((data: Uint8Array, secretKey: Uint8Array) => string) | null = null;
export let WalletV4R2Adapter: AdapterFactory | null = null;
export let WalletV5R1Adapter: AdapterFactory | null = null;

/**
 * Ensures WalletKit and TON core modules are loaded once and cached.
 * @throws Error if required modules fail to load
 */
export async function ensureWalletKitLoaded(): Promise<void> {
    if (TonWalletKit && Signer && MnemonicToKeyPair && DefaultSignature && WalletV4R2Adapter && WalletV5R1Adapter) {
        return;
    }

    if (
        !TonWalletKit ||
        !Signer ||
        !MnemonicToKeyPair ||
        !DefaultSignature ||
        !WalletV4R2Adapter ||
        !WalletV5R1Adapter
    ) {
        const module = (await walletKitModulePromise) as unknown as WalletKitModule;
        if (!module.TonWalletKit) {
            throw new Error('Failed to load TonWalletKit module');
        }
        TonWalletKit = module.TonWalletKit;
        CreateTonMnemonic = module.CreateTonMnemonic ?? CreateTonMnemonic;
        MnemonicToKeyPair = module.MnemonicToKeyPair ?? MnemonicToKeyPair;
        Signer = module.Signer ?? Signer;
        DefaultSignature = module.DefaultSignature ?? DefaultSignature;
        WalletV4R2Adapter = module.WalletV4R2Adapter ?? WalletV4R2Adapter;
        WalletV5R1Adapter = module.WalletV5R1Adapter ?? WalletV5R1Adapter;
    }
}
