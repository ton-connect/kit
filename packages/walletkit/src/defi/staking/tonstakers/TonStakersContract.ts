/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell } from '@ton/core';

import type { Base64String, TransactionRequestMessage, UserFriendlyAddress } from '../../../api/models';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import { CONTRACT } from './constants';
import { ParseStack } from '../../../utils';

/**
 * Low–level helper for interacting with Tonstakers staking contracts.
 *
 * This class encapsulates all contract-specific TL‑B payload building
 * and read‑only getter calls. High–level staking flows should use
 * `TonStakersStakingProvider` which composes this class.
 */
export class TonStakersContract {
    readonly address: string;

    private readonly apiClient: ApiClient;

    constructor(address: string, apiClient: ApiClient) {
        this.address = address;
        this.apiClient = apiClient;
    }

    /**
     * Build stake message payload.
     *
     * TL‑B: deposit#47d54391 query_id:uint64 = InternalMsgBody;
     */
    buildStakePayload(queryId: bigint = 1n): Base64String {
        const cell = beginCell()
            .storeUint(CONTRACT.PAYLOAD_STAKE, 32)
            .storeUint(queryId, 64)
            .storeUint(CONTRACT.PARTNER_CODE, 64)
            .endCell();

        return cell.toBoc().toString('base64') as Base64String;
    }

    /**
     * Build unstake message payload to be sent to user's tsTON jetton wallet.
     *
     * Internal body:
     *  - op: burn#595f07bc (see TonstakersBurnPayload specification)
     *  - query_id: uint64
     *  - amount: Coins
     *  - response_destination: MsgAddress (user address)
     *  - custom_payload: Maybe ^Cell (TonstakersBurnPayload)
     */
    buildUnstakePayload(params: {
        amount: bigint;
        userAddress: UserFriendlyAddress;
        waitTillRoundEnd: boolean;
        fillOrKill: boolean;
        queryId?: bigint;
    }): Base64String {
        const { amount, userAddress, waitTillRoundEnd, fillOrKill, queryId = 0n } = params;

        const burnPayloadCell = beginCell()
            .storeBit(waitTillRoundEnd ? 1 : 0)
            .storeBit(fillOrKill ? 1 : 0)
            .endCell();

        const cell = beginCell()
            .storeUint(CONTRACT.PAYLOAD_UNSTAKE, 32)
            .storeUint(queryId, 64)
            .storeCoins(amount)
            .storeAddress(Address.parse(userAddress))
            .storeMaybeRef(burnPayloadCell)
            .endCell();

        return cell.toBoc().toString('base64') as Base64String;
    }

    /**
     * Resolve tsTON jetton wallet address for a given owner address.
     *
     * This uses on‑chain getter `get_pool_full_data` on the staking contract
     * to locate the jetton minter, then calls `get_wallet_address` on it.
     */
    async getJettonWalletAddress(userAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        // 1. Resolve jetton minter from pool data
        const poolInfoResult = await this.apiClient.runGetMethod(this.address, 'get_pool_full_data');

        let jettonMinterAddress: string | undefined;

        if (poolInfoResult.stack && poolInfoResult.stack.length > 0) {
            const parsedStack = ParseStack(poolInfoResult.stack);
            for (const item of parsedStack) {
                if (item.type === 'cell') {
                    try {
                        const slice = item.cell.beginParse();
                        const addr = slice.loadAddress();
                        if (addr && addr.hash && addr.hash.length > 0 && !addr.equals(Address.parse(this.address))) {
                            jettonMinterAddress = addr.toString();
                            break;
                        }
                    } catch {
                        // Ignore parse errors and continue scanning stack
                    }
                }
            }
        }

        if (!jettonMinterAddress) {
            throw new Error('Jetton minter address not found in pool data');
        }

        // 2. Resolve jetton wallet address using minter's get_wallet_address
        const addressCell = beginCell().storeAddress(Address.parse(userAddress)).endCell().toBoc().toString('base64');

        const result = await this.apiClient.runGetMethod(jettonMinterAddress, 'get_wallet_address', [
            { type: 'cell', value: addressCell },
        ]);

        if (result.stack && result.stack.length > 0) {
            const parsedStack = ParseStack(result.stack);
            if (parsedStack.length > 0 && parsedStack[0].type === 'cell') {
                const addressSlice = parsedStack[0].cell.beginParse();
                const address = addressSlice.loadAddress();
                return address.toString() as UserFriendlyAddress;
            }
        }

        throw new Error('Failed to get jetton wallet address from minter');
    }

    /**
     * Read tsTON balance for user from jetton wallet contract.
     */
    async getStakedBalance(userAddress: UserFriendlyAddress): Promise<bigint> {
        const jettonWalletAddress = await this.getJettonWalletAddress(userAddress);
        const result = await this.apiClient.runGetMethod(jettonWalletAddress, 'get_wallet_data');

        if (result.stack && result.stack.length > 0) {
            const parsedStack = ParseStack(result.stack);
            if (parsedStack.length > 0 && parsedStack[0].type === 'int') {
                return parsedStack[0].value;
            }
        }

        return 0n;
    }

    /**
     * Helper to construct a TransactionRequestMessage for unstake flow.
     *
     * Note: fee amount is not applied here and should be added by caller.
     */
    async buildUnstakeMessage(params: {
        amount: bigint;
        userAddress: UserFriendlyAddress;
        waitTillRoundEnd: boolean;
        fillOrKill: boolean;
    }): Promise<TransactionRequestMessage> {
        const { amount, userAddress, waitTillRoundEnd, fillOrKill } = params;

        const jettonWalletAddress = await this.getJettonWalletAddress(userAddress);
        const payload = this.buildUnstakePayload({
            amount,
            userAddress,
            waitTillRoundEnd,
            fillOrKill,
        });

        return {
            address: jettonWalletAddress,
            amount: CONTRACT.UNSTAKE_FEE_RES.toString(),
            payload,
        };
    }
}
