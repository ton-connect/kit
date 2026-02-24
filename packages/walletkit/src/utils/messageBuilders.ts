/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Builder, Cell } from '@ton/core';
import { Address, beginCell, Cell as TonCell } from '@ton/core';

import { OpCode } from '../types/toncenter/parsers';
import type { Base64String, TransactionRequest, TransactionRequestMessage, UserFriendlyAddress } from '../api/models';
import { SendModeFlag } from '../api/models';
import { validateTransactionMessage } from '../validation';

// ==========================================
// Constants
// ==========================================

/** Default gas fee for jetton transfers (0.05 TON) */
export const DEFAULT_JETTON_GAS_FEE = '50000000';

/** Default gas fee for NFT transfers (0.1 TON) */
export const DEFAULT_NFT_GAS_FEE = '100000000';

/** Default forward amount for jetton/NFT transfers (1 nanoton) */
export const DEFAULT_FORWARD_AMOUNT = 1n;

// ==========================================
// Jetton Transfer Message
// ==========================================

export interface JettonTransferMessage {
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}

/**
 * Stores a jetton transfer message into a builder
 */
export function storeJettonTransferMessage(src: JettonTransferMessage) {
    return (builder: Builder) => {
        builder.storeUint(Number(OpCode.JettonTransfer), 32);
        builder.storeUint(src.queryId, 64);
        builder.storeCoins(src.amount);
        builder.storeAddress(src.destination);
        builder.storeAddress(src.responseDestination);
        builder.storeMaybeRef(src.customPayload);
        builder.storeCoins(src.forwardAmount ?? 0);
        builder.storeMaybeRef(src.forwardPayload);
    };
}

/**
 * Creates a jetton transfer payload cell
 */
export function createJettonTransferPayload(params: {
    amount: bigint;
    destination: UserFriendlyAddress;
    responseDestination: UserFriendlyAddress;
    comment?: string;
    queryId?: bigint;
    customPayload?: Cell | null;
    forwardAmount?: bigint;
}): Cell {
    const forwardPayload = params.comment ? createCommentPayload(params.comment) : null;

    return beginCell()
        .store(
            storeJettonTransferMessage({
                queryId: params.queryId ?? 0n,
                amount: params.amount,
                destination: Address.parse(params.destination),
                responseDestination: Address.parse(params.responseDestination),
                customPayload: params.customPayload ?? null,
                forwardAmount: params.forwardAmount ?? DEFAULT_FORWARD_AMOUNT,
                forwardPayload: forwardPayload,
            }),
        )
        .endCell();
}

// ==========================================
// NFT Transfer Message
// ==========================================

export interface NftTransferMessage {
    queryId: bigint;
    newOwner: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
}

/**
 * Stores an NFT transfer message into a builder
 */
export function storeNftTransferMessage(message: NftTransferMessage): (builder: Builder) => void {
    return (builder) => {
        builder.storeUint(Number(OpCode.NftTransfer), 32);
        builder.storeUint(message.queryId, 64);
        builder.storeAddress(message.newOwner);
        builder.storeAddress(message.responseDestination);
        builder.storeMaybeRef(message.customPayload);
        builder.storeCoins(message.forwardAmount);
        builder.storeMaybeRef(message.forwardPayload);
    };
}

/**
 * Creates an NFT transfer payload cell
 */
export function createNftTransferPayload(params: {
    newOwner: UserFriendlyAddress;
    responseDestination: UserFriendlyAddress;
    comment?: string;
    queryId?: bigint;
    customPayload?: Cell | null;
    forwardAmount?: bigint;
}): Cell {
    const forwardPayload = params.comment ? createCommentPayload(params.comment) : null;

    return beginCell()
        .store(
            storeNftTransferMessage({
                queryId: params.queryId ?? 0n,
                newOwner: Address.parse(params.newOwner),
                responseDestination: Address.parse(params.responseDestination),
                customPayload: params.customPayload ?? null,
                forwardAmount: params.forwardAmount ?? DEFAULT_FORWARD_AMOUNT,
                forwardPayload: forwardPayload,
            }),
        )
        .endCell();
}

export interface NftTransferRawParams {
    queryId: bigint | number | string;
    newOwner: UserFriendlyAddress | Address;
    responseDestination?: UserFriendlyAddress | Address | null;
    customPayload?: Base64String | Cell | null;
    forwardAmount: bigint | number | string;
    forwardPayload?: Base64String | Cell | null;
}

/**
 * Creates an NFT transfer payload cell from raw parameters
 * Handles string/Address conversion automatically
 */
export function createNftTransferRawPayload(params: NftTransferRawParams): Cell {
    const transferMessage: NftTransferMessage = {
        queryId: BigInt(params.queryId),
        newOwner: typeof params.newOwner === 'string' ? Address.parse(params.newOwner) : params.newOwner,
        responseDestination: params.responseDestination
            ? typeof params.responseDestination === 'string'
                ? Address.parse(params.responseDestination)
                : params.responseDestination
            : null,
        customPayload: params.customPayload
            ? typeof params.customPayload === 'string'
                ? TonCell.fromBase64(params.customPayload)
                : params.customPayload
            : null,
        forwardAmount: BigInt(params.forwardAmount),
        forwardPayload: params.forwardPayload
            ? typeof params.forwardPayload === 'string'
                ? TonCell.fromBase64(params.forwardPayload)
                : params.forwardPayload
            : null,
    };

    return beginCell().store(storeNftTransferMessage(transferMessage)).endCell();
}

// ==========================================
// Comment Payload
// ==========================================

/**
 * Creates a comment payload cell (op code 0 + text)
 */
export function createCommentPayload(comment: string): Cell {
    return beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
}

/**
 * Creates a comment payload as base64 string
 */
export function createCommentPayloadBase64(comment: string): Base64String {
    return createCommentPayload(comment).toBoc().toString('base64') as Base64String;
}

// ==========================================
// Transaction Request Builders
// ==========================================

export interface CreateTransferTransactionParams {
    targetAddress: UserFriendlyAddress;
    amount: string;
    payload: Cell;
    fromAddress: UserFriendlyAddress;
}

/**
 * Creates a standard transfer transaction request with default send mode flags
 */
export function createTransferTransaction(params: CreateTransferTransactionParams): TransactionRequest {
    const message: TransactionRequestMessage = {
        address: params.targetAddress,
        amount: params.amount,
        payload: params.payload.toBoc().toString('base64') as Base64String,
        stateInit: undefined,
        extraCurrency: undefined,
        mode: {
            flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY],
        },
    };

    if (!validateTransactionMessage(message, false).isValid) {
        throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
    }

    return {
        messages: [message],
        fromAddress: params.fromAddress,
    };
}
