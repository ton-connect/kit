import type { ApiClient } from '@ton/walletkit';
import type { CHAIN } from '@tonconnect/protocol';
import type Transport from '@ledgerhq/hw-transport';

/**
 * Configuration for creating a WalletV4R2 Ledger adapter
 */
export interface WalletV4R2LedgerAdapterConfig {
    /** Ledger TON transport */
    createTransport: () => Promise<Transport>;
    /** Derivation path for signing */
    path: number[];
    /** Public key from Ledger */
    publicKey: Uint8Array;
    /** Wallet ID configuration */
    walletId?: number;
    /** Shared TON client instance */
    tonClient: ApiClient;
    /** Network */
    network: CHAIN;
    /** Workchain */
    workchain?: number;
}

export interface WalletInitConfigLedgerInterface {
    /** Ledger transport instance */
    createTransport: () => Promise<Transport>; // @ledgerhq/hw-transport
    /** Derivation path for the account */
    path: number[];

    /** Public key from Ledger, we can use it to init stored wallets without re-connecting to Ledger */
    publicKey?: Uint8Array;
    /** Wallet version - only v4r2 supported for Ledger */
    version?: 'v4r2';
    /** Wallet ID configuration */
    walletId?: number;
    /** Network */
    network?: CHAIN;
    /** Workchain */
    workchain?: number;
    /** Account index */
    accountIndex?: number;
}
