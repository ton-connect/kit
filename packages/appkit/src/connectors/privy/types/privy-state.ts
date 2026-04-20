/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface PrivyTonWallet {
    /**
     * Privy-surfaced TON address. NOT used as our wallet's address — it's only
     * passed back to `signRawHash({ address, ... })` so Privy knows which
     * embedded key to sign with. Our wallet address is derived from the pubkey
     * via WalletV5R1 + defaultWalletIdV5R1.
     */
    signerAddress: string;
    /** Privy wallet UUID — used to fetch the public key from Privy's REST API. */
    walletId: string;
}

export interface PrivySignRawHashParams {
    address: string;
    chainType: 'ton';
    hash: `0x${string}`;
}

export interface PrivySignRawHashResult {
    /** 0x-prefixed Ed25519 signature (64 bytes → 128 hex chars after 0x). */
    signature: string;
}

export interface PrivyState {
    tonWallet: PrivyTonWallet | null;
    getAccessToken: () => Promise<string | null>;
    signRawHash: (params: PrivySignRawHashParams) => Promise<PrivySignRawHashResult>;
}
