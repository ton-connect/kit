import type { CHAIN } from '@tonconnect/protocol';

import { WalletSigner } from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';

/**
 * Configuration for creating a WalletV4R2 adapter
 */
export interface WalletV4R2AdapterConfig {
    /** Signer function */
    signer: WalletSigner;
    /** Public key */
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
