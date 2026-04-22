/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, Cell, beginCell } from '@ton/core';

import type { TransactionRequestMessage, StructuredItem, Base64String } from '../api/models';
import { SendModeFlag } from '../api/models';
import type { Wallet } from '../api/interfaces';
import {
    storeJettonTransferMessage,
    storeNftTransferMessage,
    DEFAULT_JETTON_GAS_FEE,
    DEFAULT_NFT_GAS_FEE,
    DEFAULT_FORWARD_AMOUNT,
} from './messageBuilders';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('ItemsResolver');

/**
 * Resolve structured items (ton/jetton/nft) into raw TransactionRequestMessages.
 * After resolution, downstream code only needs to handle messages.
 */
export async function resolveItemsToMessages(
    items: StructuredItem[],
    wallet: Wallet,
): Promise<TransactionRequestMessage[]> {
    const messages: TransactionRequestMessage[] = [];

    for (const item of items) {
        switch (item.type) {
            case 'ton':
                messages.push(resolveTonItem(item));
                break;
            case 'jetton':
                messages.push(await resolveJettonItem(item, wallet));
                break;
            case 'nft':
                messages.push(resolveNftItem(item, wallet));
                break;
            default:
                log.warn('Unknown item type, skipping', { item });
                break;
        }
    }

    return messages;
}

function resolveTonItem(item: StructuredItem & { type: 'ton' }): TransactionRequestMessage {
    return {
        address: item.address,
        amount: item.amount,
        payload: item.payload as Base64String,
        stateInit: item.stateInit as Base64String,
        extraCurrency: item.extraCurrency,
        mode: { flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY] },
    };
}

async function resolveJettonItem(
    item: StructuredItem & { type: 'jetton' },
    wallet: Wallet,
): Promise<TransactionRequestMessage> {
    // Resolve the sender's jetton wallet address from the jetton master
    const jettonWalletAddress = await wallet.getJettonWalletAddress(item.master);

    const customPayload = item.customPayload ? Cell.fromBase64(item.customPayload) : null;
    const forwardPayload = item.forwardPayload ? Cell.fromBase64(item.forwardPayload) : null;

    const payload = beginCell()
        .store(
            storeJettonTransferMessage({
                queryId: item.queryId ? BigInt(item.queryId) : 0n,
                amount: BigInt(item.amount),
                destination: Address.parse(item.destination),
                responseDestination: item.responseDestination
                    ? Address.parse(item.responseDestination)
                    : Address.parse(wallet.getAddress()),
                customPayload,
                forwardAmount: item.forwardAmount ? BigInt(item.forwardAmount) : DEFAULT_FORWARD_AMOUNT,
                forwardPayload,
            }),
        )
        .endCell();

    return {
        address: jettonWalletAddress,
        amount: item.attachAmount ?? DEFAULT_JETTON_GAS_FEE,
        payload: payload.toBoc().toString('base64') as Base64String,
        mode: { flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY] },
    };
}

function resolveNftItem(item: StructuredItem & { type: 'nft' }, wallet: Wallet): TransactionRequestMessage {
    const customPayload = item.customPayload ? Cell.fromBase64(item.customPayload) : null;
    const forwardPayload = item.forwardPayload ? Cell.fromBase64(item.forwardPayload) : null;

    const payload = beginCell()
        .store(
            storeNftTransferMessage({
                queryId: item.queryId ? BigInt(item.queryId) : 0n,
                newOwner: Address.parse(item.newOwner),
                responseDestination: item.responseDestination
                    ? Address.parse(item.responseDestination)
                    : Address.parse(wallet.getAddress()),
                customPayload,
                forwardAmount: item.forwardAmount ? BigInt(item.forwardAmount) : DEFAULT_FORWARD_AMOUNT,
                forwardPayload,
            }),
        )
        .endCell();

    return {
        address: item.nftAddress,
        amount: item.attachAmount ?? DEFAULT_NFT_GAS_FEE,
        payload: payload.toBoc().toString('base64') as Base64String,
        mode: { flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY] },
    };
}
