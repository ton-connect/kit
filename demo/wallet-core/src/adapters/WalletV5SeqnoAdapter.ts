/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    ActionSendMsg,
    CallForSuccess,
    ERROR_CODES,
    packActionsList,
    WalletKitError,
    WalletV5R1Adapter,
} from '@ton/walletkit';
import type { StateInit } from '@ton/core';
import { Address, beginCell, Cell, external, internal, loadStateInit, SendMode, storeMessage } from '@ton/core';
import type { Base64String, Network, TransactionRequest } from '@ton/walletkit';
import type { WalletSigner } from '@ton/walletkit';
import type { Maybe } from '@ton/core/dist/utils/maybe';

import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('WalletV5SeqnoAdapter');

/** Local seqno entry for fast send */
export type LocalSeqnoEntry = { seqno: number; timestamp: number };

export interface WalletV5SeqnoAdapterOptions {
    client: Parameters<typeof WalletV5R1Adapter.create>[1]['client'];
    network: Network;
    walletId?: number | bigint;
    workchain?: number;
    /** Wallet address for local seqno storage */
    walletAddress: string;
    /** Get local seqno for address */
    getLocalSeqno: (address: string) => LocalSeqnoEntry | undefined;
    /** Persist seqno after use (optimistic - called before send) */
    setLocalSeqno?: (address: string, seqno: number) => void;
}

/**
 * WalletV5 adapter with local seqno storage for fast send (prevents duplicate seqno on rapid clicks).
 * Extends WalletV5R1Adapter and overrides getSignedSendTransaction.
 */
export class WalletV5SeqnoAdapter extends WalletV5R1Adapter {
    private readonly walletAddress: string;
    private readonly getLocalSeqno: (address: string) => LocalSeqnoEntry | undefined;
    private readonly setLocalSeqno?: (address: string, seqno: number) => void;

    static async create(signer: WalletSigner, options: WalletV5SeqnoAdapterOptions): Promise<WalletV5SeqnoAdapter> {
        const { walletAddress, getLocalSeqno, setLocalSeqno, client, network, walletId, workchain } = options;
        const config: ConstructorParameters<typeof WalletV5R1Adapter>[0] = {
            signer,
            publicKey: signer.publicKey,
            tonClient: client,
            network,
            walletId,
            workchain,
        };
        return new WalletV5SeqnoAdapter(config, walletAddress, getLocalSeqno, setLocalSeqno);
    }

    private constructor(
        config: ConstructorParameters<typeof WalletV5R1Adapter>[0],
        walletAddress: string,
        getLocalSeqno: (address: string) => LocalSeqnoEntry | undefined,
        setLocalSeqno?: (address: string, seqno: number) => void,
    ) {
        super(config);
        this.walletAddress = walletAddress;
        this.getLocalSeqno = getLocalSeqno;
        this.setLocalSeqno = setLocalSeqno;
    }

    override async getSignedSendTransaction(
        input: TransactionRequest,
        options?: { fakeSignature: boolean },
    ): Promise<Base64String> {
        const opts = options ?? { fakeSignature: false };
        const actions = packActionsList(
            input.messages.map((m) => {
                let bounce = true;
                const parsedAddress = Address.parseFriendly(m.address);
                if (parsedAddress.isBounceable === false) {
                    bounce = false;
                }

                const msg = internal({
                    to: m.address,
                    value: BigInt(m.amount),
                    bounce,
                    extracurrency: m.extraCurrency
                        ? Object.fromEntries(Object.entries(m.extraCurrency).map(([k, v]) => [Number(k), BigInt(v)]))
                        : undefined,
                });

                if (m.payload) {
                    try {
                        msg.body = Cell.fromBase64(m.payload);
                    } catch (error) {
                        log.warn('Failed to load payload', { error });
                        throw WalletKitError.fromError(
                            ERROR_CODES.CONTRACT_VALIDATION_FAILED,
                            'Failed to parse transaction payload',
                            error,
                        );
                    }
                }
                if (m.stateInit) {
                    try {
                        msg.init = loadStateInit(Cell.fromBase64(m.stateInit).asSlice());
                    } catch (error) {
                        log.warn('Failed to load state init', { error });
                        throw WalletKitError.fromError(
                            ERROR_CODES.CONTRACT_VALIDATION_FAILED,
                            'Failed to parse state init',
                            error,
                        );
                    }
                }
                return new ActionSendMsg(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, msg as never);
            }),
        );

        const createBodyOptions: { validUntil: number | undefined; fakeSignature: boolean } = {
            ...opts,
            validUntil: undefined,
        };
        if (input.validUntil) {
            const now = Math.floor(Date.now() / 1000);
            const maxValidUntil = now + 600;
            if (input.validUntil < now) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Transaction validUntil timestamp is in the past',
                    undefined,
                    { validUntil: input.validUntil, currentTime: now },
                );
            }
            if (input.validUntil > maxValidUntil) {
                createBodyOptions.validUntil = maxValidUntil;
            } else {
                createBodyOptions.validUntil = input.validUntil;
            }
        }

        const networkSeqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        const local = this.getLocalSeqno(this.walletAddress);
        let seqno = networkSeqno;
        if (local) {
            const localSeqnoNext = local.seqno + 1;
            const now = Date.now();
            if (now - local.timestamp < 5000) {
                seqno = Math.max(networkSeqno, localSeqnoNext);
            }
        }

        this.setLocalSeqno?.(this.walletAddress, seqno);

        const walletId = (await this.walletContract.walletId).serialized;
        if (!walletId) {
            throw new Error('Failed to get seqno or walletId');
        }

        const transfer = await this.createBodyV5(seqno, walletId, actions, createBodyOptions);

        const ext = external({
            to: this.walletContract.address.toString(),
            init: this.walletContract.init as Maybe<StateInit>,
            body: transfer as unknown as Cell,
        });
        return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64') as Base64String;
    }
}
