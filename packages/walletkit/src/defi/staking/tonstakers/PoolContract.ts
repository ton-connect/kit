/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell } from '@ton/core';

import type { Base64String, TokenAmount, TransactionRequestMessage, UserFriendlyAddress } from '../../../api/models';
import type { ApiClient } from '../../../api/interfaces';
import { CONTRACT } from './constants';
import { asAddressFriendly, ReaderStack, SerializeStack } from '../../../utils';

export interface PoolData {
    /** Total TON balance in the pool (nanoTON) */
    totalBalance: bigint;
    /** Total tsTON supply (nanotsTON) */
    supply: bigint;
    /** Projected TON balance at round end (nanoTON) */
    projectedBalance: bigint;
    /** Projected tsTON supply at round end (nanotsTON) */
    projectedSupply: bigint;
}

export class PoolContract {
    readonly address: UserFriendlyAddress;

    private readonly client: ApiClient;

    constructor(address: string | UserFriendlyAddress, client: ApiClient) {
        this.address = asAddressFriendly(address);
        this.client = client;
    }

    async getJettonMinter(): Promise<UserFriendlyAddress> {
        const data = await this.client.runGetMethod(this.address, 'get_pool_full_data');
        const stack = ReaderStack(data.stack);

        // Skip all fields until jettonMinter
        // 0: state, 1: halted, 2: totalBalance, 3: interestRatePercent
        // 4: optimisticDepositWithdrawals, 5: depositsOpen, 6: savedValidatorSetHash
        // 7: prevRound, 8: currentRound, 9: minLoan, 10: maxLoan, 11: governanceFeePercent
        stack.skip(12);

        return asAddressFriendly(stack.readAddress());
    }

    async getJettonWalletAddress(userAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        const jettonMinter = await this.getJettonMinter();
        const data = await this.client.runGetMethod(
            jettonMinter,
            'get_wallet_address',
            SerializeStack([{ type: 'slice', cell: beginCell().storeAddress(Address.parse(userAddress)).endCell() }]),
        );
        const stack = ReaderStack(data.stack);
        return asAddressFriendly(stack.readAddress());
    }

    async getStakedBalance(userAddress: UserFriendlyAddress): Promise<TokenAmount> {
        const jettonWalletAddress = await this.getJettonWalletAddress(userAddress);
        const data = await this.client.runGetMethod(jettonWalletAddress, 'get_wallet_data');
        const stack = ReaderStack(data.stack);
        return stack.readBigNumber().toString();
    }

    /**
     * Build stake message payload.
     * TL‑B: deposit#47d54391 query_id:uint64 = InternalMsgBody;
     */
    buildStakePayload(queryId: bigint = 0n): Base64String {
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
     * Helper to construct a TransactionRequestMessage for unstake flow.
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

    /**
     * Get staking contract balance (instant liquidity available).
     */
    async getPoolBalance(): Promise<bigint> {
        const balance = await this.client.getBalance(this.address);
        return BigInt(balance);
    }

    /**
     * Get raw pool data for precise bigint calculations.
     *
     * Exchange rates can be derived as:
     * - spot rate (tsTON→TON): `totalBalance / supply`
     * - projected rate: `projectedBalance / projectedSupply`
     */
    async getPoolData(): Promise<PoolData> {
        const data = await this.client.runGetMethod(this.address, 'get_pool_full_data');
        const stack = ReaderStack(data.stack);

        stack.skip(2); // Skip state, halted
        const totalBalance = stack.readBigNumber();

        stack.skip(10); // Skip up to minter
        const supply = stack.readBigNumber();

        stack.skip(14); // Skip to projected balance
        const projectedBalance = stack.readBigNumber();
        const projectedSupply = stack.readBigNumber();

        return { totalBalance, supply, projectedBalance, projectedSupply };
    }
}
