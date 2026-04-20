/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ApiClient,
    Hex,
    SendTransactionResponse,
    TransactionRequest as WalletKitTransactionRequest,
    UserFriendlyAddress,
    WalletSigner,
} from '@ton/walletkit';
import {
    asHex,
    createWalletId,
    defaultWalletIdV5R1,
    getNormalizedExtMessageHash,
    PrepareSignData,
    WalletV5R1Adapter,
} from '@ton/walletkit';

import type { WalletInterface } from '../../../types/wallet';
import type { TransactionRequest } from '../../../types/transaction';
import type { SignDataRequest, SignDataResponse } from '../../../types/signing';
import type { Base64String } from '../../../types/primitives';
import type { Network } from '../../../types/network';
import type { PrivyState } from '../types/privy-state';

export interface PrivyWalletAdapterConfig {
    connectorId: string;
    /**
     * Privy-surfaced address used only as the `signRawHash({ address, ... })` identifier
     * so Privy knows which embedded key to sign with. Our wallet's on-chain address is
     * derived from `publicKey`, not from this field.
     */
    signerAddress: string;
    /** Ed25519 public key fetched via `fetchPrivyTonWalletPublicKey`. */
    publicKey: Hex;
    network: Network;
    /** TON client for this network (e.g. `networkManager.getClient(network)`). */
    apiClient: ApiClient;
    signRawHash: PrivyState['signRawHash'];
    /** Subwallet id for V5R1. Defaults to `defaultWalletIdV5R1`. */
    walletId?: number;
}

/**
 * Wraps a Privy embedded TON wallet as an AppKit `WalletInterface`.
 *
 * Signing is bridged to Privy's `signRawHash`; transaction construction and address
 * derivation are delegated to `WalletV5R1Adapter` from `@ton/walletkit`. The wallet's
 * on-chain address is always the V5R1 contract address derived from the supplied
 * public key — the Privy-surfaced address is treated as an opaque signer handle.
 */
export class PrivyWalletAdapter implements WalletInterface {
    public readonly connectorId: string;

    private readonly signerAddress: string;
    private readonly publicKey: Hex;
    private readonly network: Network;
    private readonly apiClient: ApiClient;
    private readonly walletAdapter: WalletV5R1Adapter;

    constructor(config: PrivyWalletAdapterConfig) {
        this.connectorId = config.connectorId;
        this.signerAddress = config.signerAddress;
        this.publicKey = config.publicKey;
        this.network = config.network;
        this.apiClient = config.apiClient;

        const signer: WalletSigner = {
            publicKey: this.publicKey,
            sign: async (bytes) => {
                const hashHex = toHexPrefixed(bytes);
                const { signature } = await config.signRawHash({
                    address: this.signerAddress,
                    chainType: 'ton',
                    hash: hashHex,
                });
                return asHex(signature);
            },
        };

        this.walletAdapter = new WalletV5R1Adapter({
            signer,
            publicKey: this.publicKey,
            tonClient: this.apiClient,
            network: this.network,
            walletId: config.walletId ?? defaultWalletIdV5R1,
        });
    }

    getAddress(): UserFriendlyAddress {
        return this.walletAdapter.getAddress();
    }

    getPublicKey(): Hex {
        return this.publicKey;
    }

    getNetwork(): Network {
        return this.network;
    }

    getWalletId(): string {
        return createWalletId(this.network, this.getAddress());
    }

    async sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse> {
        // appkit and walletkit share the same TransactionRequest shape; walletkit brands
        // `payload`/`stateInit` as Base64String while appkit leaves them as plain strings.
        // The values are base64 by contract in both, so a structural cast is safe here.
        const boc = await this.walletAdapter.getSignedSendTransaction(request as WalletKitTransactionRequest);
        await this.apiClient.sendBoc(boc);

        const { hash, boc: normalizedBoc } = getNormalizedExtMessageHash(boc);
        return {
            boc: boc as Base64String,
            normalizedBoc,
            normalizedHash: hash,
        };
    }

    async signData(payload: SignDataRequest): Promise<SignDataResponse> {
        const prepared = PrepareSignData({
            address: this.getAddress(),
            domain: resolveDomain(),
            payload: {
                network: payload.network ?? this.network,
                fromAddress: payload.from,
                data: payload.data,
            },
        });

        const signature = await this.walletAdapter.getSignedSignData(prepared);

        return {
            payload,
            address: prepared.address,
            timestamp: prepared.timestamp,
            domain: prepared.domain,
            signature,
        };
    }
}

function toHexPrefixed(bytes: Iterable<number>): `0x${string}` {
    const buf = Buffer.from(Uint8Array.from(bytes));
    return `0x${buf.toString('hex')}` as `0x${string}`;
}

function resolveDomain(): string {
    if (typeof window !== 'undefined' && window.location?.host) {
        return window.location.host;
    }
    return 'appkit.local';
}
