/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell } from '@ton/core';

import type { Base64String, TokenAmount, TransactionRequestMessage, UserFriendlyAddress } from '../../../api/models';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import { CONTRACT } from './constants';
import { asAddressFriendly, ReaderStack, SerializeStack } from '../../../utils';
import { formatUnits } from '../../../utils/units';

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
     * Get current and projected exchange rates for tsTON/TON.
     */
    async getRates(): Promise<{ tsTONTON: number; tsTONTONProjected: number }> {
        const data = await this.client.runGetMethod(this.address, 'get_pool_full_data');
        const stack = ReaderStack(data.stack);

        stack.skip(2); // Skip state, halted
        const totalBalance = Number(formatUnits(stack.readBigNumber(), 9));

        stack.skip(10); // Skip up to minter
        const supply = Number(formatUnits(stack.readBigNumber(), 9));

        stack.skip(14); // Skip to projected balance
        const projectedBalance = Number(formatUnits(stack.readBigNumber(), 9));
        const projectedSupply = Number(formatUnits(stack.readBigNumber(), 9));

        const tsTONTON = supply > 0 ? totalBalance / supply : 1;
        const tsTONTONProjected = projectedSupply > 0 ? projectedBalance / projectedSupply : 1;

        return {
            tsTONTON,
            tsTONTONProjected,
        };
    }
}
