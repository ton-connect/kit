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
import type { TonChainEnum, WalletKitInstance, WalletKitAdapter, WalletKitSigner } from '../types';

const walletKitModulePromise = import('@ton/walletkit');
const tonCoreModulePromise = import('@ton/core');

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
    createWalletInitConfigMnemonic?: unknown;
    createWalletManifest?: (options: { bridgeUrl: string; name: string; appName: string }) => Record<string, unknown>;
    CreateTonMnemonic?: () => Promise<string[] | string>;
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
    CHAIN?: TonChainEnum;
};

type TonCoreModule = {
    Address?: unknown;
    Cell?: unknown;
};

export let TonWalletKit: TonWalletKitConstructor | null = null;
export let createWalletInitConfigMnemonic: unknown = null;
export let createWalletManifest:
    | ((options: { bridgeUrl: string; name: string; appName: string }) => Record<string, unknown>)
    | null = null;
export let CreateTonMnemonic: (() => Promise<string[] | string>) | null = null;
export let MnemonicToKeyPair:
    | ((mnemonic: string[], type: string) => Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }>)
    | null = null;
export let Signer: SignerFactory | null = null;
export let DefaultSignature: ((data: Uint8Array, secretKey: Uint8Array) => string) | null = null;
export let WalletV4R2Adapter: AdapterFactory | null = null;
export let WalletV5R1Adapter: AdapterFactory | null = null;
export let Address: unknown;
export let Cell: unknown;
export let CHAIN: TonChainEnum | null = null;
export let tonConnectChain: TonChainEnum | null = null;

/**
 * Ensures WalletKit and TON core modules are loaded once and cached.
 */
export async function ensureWalletKitLoaded(): Promise<void> {
    if (
        TonWalletKit &&
        createWalletInitConfigMnemonic &&
        tonConnectChain &&
        CHAIN &&
        Address &&
        Cell &&
        Signer &&
        MnemonicToKeyPair &&
        DefaultSignature &&
        WalletV4R2Adapter &&
        WalletV5R1Adapter
    ) {
        return;
    }

    if (
        !TonWalletKit ||
        !createWalletInitConfigMnemonic ||
        !Signer ||
        !MnemonicToKeyPair ||
        !DefaultSignature ||
        !WalletV4R2Adapter ||
        !WalletV5R1Adapter ||
        !CHAIN
    ) {
        const module = (await walletKitModulePromise) as WalletKitModule;
        TonWalletKit = module.TonWalletKit;
        createWalletInitConfigMnemonic = module.createWalletInitConfigMnemonic ?? createWalletInitConfigMnemonic;
        CreateTonMnemonic = module.CreateTonMnemonic ?? CreateTonMnemonic;
        MnemonicToKeyPair = module.MnemonicToKeyPair ?? MnemonicToKeyPair;
        createWalletManifest = module.createWalletManifest ?? createWalletManifest;
        CHAIN = module.CHAIN ?? CHAIN;
        tonConnectChain = module.CHAIN ?? tonConnectChain;
        Signer = module.Signer ?? Signer;
        DefaultSignature = module.DefaultSignature ?? DefaultSignature;
        WalletV4R2Adapter = module.WalletV4R2Adapter ?? WalletV4R2Adapter;
        WalletV5R1Adapter = module.WalletV5R1Adapter ?? WalletV5R1Adapter;
    }

    if (!Address || !Cell) {
        const coreModule = (await tonCoreModulePromise) as TonCoreModule;
        Address = coreModule.Address ?? Address;
        Cell = coreModule.Cell ?? Cell;
    }

    if (!tonConnectChain || !CHAIN) {
        const module = (await walletKitModulePromise) as WalletKitModule;
        tonConnectChain = module.CHAIN ?? tonConnectChain;
        CHAIN = module.CHAIN ?? CHAIN;
        if (!tonConnectChain || !CHAIN) {
            throw new Error('TonWalletKit did not expose CHAIN enum');
        }
    }
}
