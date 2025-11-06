/**
 * Lazy module loader for WalletKit and TON core primitives.
 */
import type { TonChainEnum } from '../types';

const walletKitModulePromise = import('@ton/walletkit');
const tonCoreModulePromise = import('@ton/core');

export let TonWalletKit: any;
export let createWalletInitConfigMnemonic: any;
export let createWalletManifest: any;
export let CreateTonMnemonic: any;
export let Signer: any;
export let WalletV4R2Adapter: any;
export let WalletV5R1Adapter: any;
export let Address: any;
export let Cell: any;
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
    WalletV4R2Adapter &&
    WalletV5R1Adapter
  ) {
    return;
  }

  if (!TonWalletKit || !createWalletInitConfigMnemonic || !Signer || !WalletV4R2Adapter || !WalletV5R1Adapter || !CHAIN) {
    const module = await walletKitModulePromise;
    TonWalletKit = (module as any).TonWalletKit;
    createWalletInitConfigMnemonic = (module as any).createWalletInitConfigMnemonic;
    CreateTonMnemonic = (module as any).CreateTonMnemonic ?? (module as any).CreateTonMnemonic;
    createWalletManifest = (module as any).createWalletManifest ?? createWalletManifest;
    CHAIN = (module as any).CHAIN;
    tonConnectChain = (module as any).CHAIN ?? tonConnectChain;
    Signer = (module as any).Signer;
    WalletV4R2Adapter = (module as any).WalletV4R2Adapter;
    WalletV5R1Adapter = (module as any).WalletV5R1Adapter;
  }

  if (!Address || !Cell) {
    const coreModule = await tonCoreModulePromise;
    Address = (coreModule as any).Address;
    Cell = (coreModule as any).Cell;
  }

  if (!tonConnectChain || !CHAIN) {
    const module = await walletKitModulePromise;
    tonConnectChain = (module as any).CHAIN ?? null;
    CHAIN = (module as any).CHAIN;
    if (!tonConnectChain || !CHAIN) {
      throw new Error('TonWalletKit did not expose CHAIN enum');
    }
  }
}
