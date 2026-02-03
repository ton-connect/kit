/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell, DictionaryValue } from '@ton/core';
import { Address, beginCell, Dictionary } from '@ton/core';

import type {
    Base64String,
    Hex,
    TokenAmount,
    TransactionRequestMessage,
    UserFriendlyAddress,
} from '../../../api/models';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import { CONTRACT, TIMING } from './constants';
import { asAddressFriendly, asHex, asMaybeAddressFriendly, ReaderStack, SerializeStack } from '../../../utils';
import type { RoundInfo } from '../types';

const SHARE_BASIS = 2 ** 24; // 24 bit

export enum PoolState {
    Normal = 0,
    RepaymentOnly = 1,
}

export type BorrowerDescription = {
    borrowed: TokenAmount;
    accountedInterest: TokenAmount;
};

export const BorrowerDescriptionValue: DictionaryValue<BorrowerDescription> = {
    serialize: (src, builder) => {
        builder.storeCoins(BigInt(src.borrowed));
        builder.storeCoins(BigInt(src.accountedInterest));
    },
    parse: (src) => {
        return {
            borrowed: src.loadCoins().toString(),
            accountedInterest: src.loadCoins().toString(),
        };
    },
};

export interface PoolRoundData {
    borrowers: Dictionary<Address, BorrowerDescription>;
    roundId: number;
    activeBorrowers: bigint;
    borrowed: bigint;
    expected: bigint;
    returned: bigint;
    profit: bigint;
}

export type UpdateAfter = Date | 'completed';

function asUpdateAfter(value: number): UpdateAfter {
    const COMPLETED_FLAG = 0xffffffffffff; // 281474976710655
    if (value === COMPLETED_FLAG) {
        return 'completed';
    }
    return new Date(value * 1000);
}

export interface PoolFullData {
    state: PoolState;
    halted: boolean;
    totalBalance: TokenAmount;
    interestRatePercent: number;
    optimisticDepositWithdrawals: boolean;
    depositsOpen: boolean;
    savedValidatorSetHash: Hex;

    prevRound: PoolRoundData;
    currentRound: PoolRoundData;
    minLoan: TokenAmount;
    maxLoan: TokenAmount;
    governanceFeePercent: number;

    jettonMinter: UserFriendlyAddress;
    supply: TokenAmount;

    depositPayout: UserFriendlyAddress | null;
    requestedForDeposit: TokenAmount;
    withdrawalPayout: UserFriendlyAddress | null;
    requestedForWithdrawal: TokenAmount;

    sudoer: UserFriendlyAddress;
    sudoerSetAt: Date;
    governor: UserFriendlyAddress;
    governorUpdateAfter: UpdateAfter;
    interestManager: UserFriendlyAddress;
    halter: UserFriendlyAddress;
    approver: UserFriendlyAddress;

    controllerCode: Cell;
    poolJettonWalletCode: Cell;
    payoutMinterCode: Cell;

    projectedTotalBalance: TokenAmount;
    projectedPoolSupply: TokenAmount;
}

export interface PoolSimpleData {
    state: PoolState;
    halted: boolean;
    totalBalance: TokenAmount;
    supply: TokenAmount;
    interestRatePercent: number;
}

function parseBorrowers(data: Cell | null, workChain = 0): Dictionary<Address, BorrowerDescription> {
    const list = Dictionary.empty(Dictionary.Keys.Address(), BorrowerDescriptionValue);
    if (data) {
        const raw = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), BorrowerDescriptionValue, data.asSlice());
        for (const hash of raw.keys()) {
            list.set(
                Address.parse(`${workChain}:${hash.toString(16).padStart(64, '0')}`),
                raw.get(hash) as BorrowerDescription,
            );
        }
    }
    return list;
}

export class PoolContract {
    readonly address: UserFriendlyAddress;

    private readonly client: ApiClient;

    constructor(address: string | UserFriendlyAddress, client: ApiClient) {
        this.address = asAddressFriendly(address);
        this.client = client;
    }

    /**
     * Get contract code version (git commit hash).
     *
     * Returns the git commit hash from the liquid staking contract repository:
     * https://github.com/ton-blockchain/liquid-staking-contract
     */
    async getCodeVersion(): Promise<string> {
        const data = await this.client.runGetMethod(this.address, 'get_code_version');
        const stack = ReaderStack(data.stack);
        const version = stack.readBigNumber().toString(16).padStart(40, '0');
        return `https://github.com/ton-blockchain/liquid-staking-contract/tree/${version}`;
    }

    async getPoolFullData(): Promise<PoolFullData> {
        const data = await this.client.runGetMethod(this.address, 'get_pool_full_data');
        const stack = ReaderStack(data.stack);
        const state = stack.readNumber() as PoolState;
        const halted = stack.readBoolean();
        const totalBalance = stack.readBigNumber().toString();
        const interestRatePercent = (stack.readNumber() / SHARE_BASIS) * 100;
        const optimisticDepositWithdrawals = stack.readBoolean();
        const depositsOpen = stack.readBoolean();
        const savedValidatorSetHash = asHex(`0x${stack.readBigNumber().toString(16).padStart(64, '0')}`);
        const workChain = Address.parse(this.address).workChain;
        const prev = stack.readTuple();
        const prevRound = {
            borrowers: parseBorrowers(prev.readCellOpt(), workChain),
            roundId: prev.readNumber(),
            activeBorrowers: prev.readBigNumber(),
            borrowed: prev.readBigNumber(),
            expected: prev.readBigNumber(),
            returned: prev.readBigNumber(),
            profit: prev.readBigNumber(),
        };

        const current = stack.readTuple();
        const currentRound = {
            borrowers: parseBorrowers(current.readCellOpt(), workChain),
            roundId: current.readNumber(),
            activeBorrowers: current.readBigNumber(),
            borrowed: current.readBigNumber(),
            expected: current.readBigNumber(),
            returned: current.readBigNumber(),
            profit: current.readBigNumber(),
        };

        const minLoan = stack.readBigNumber().toString();
        const maxLoan = stack.readBigNumber().toString();
        const governanceFeePercent = (stack.readNumber() / SHARE_BASIS) * 100;

        const jettonMinter = asAddressFriendly(stack.readAddress());
        const supply = stack.readBigNumber().toString();

        const depositPayout = asMaybeAddressFriendly(stack.readAddressOpt()?.toString());
        const requestedForDeposit = stack.readBigNumber().toString();

        const withdrawalPayout = asMaybeAddressFriendly(stack.readAddressOpt()?.toString());
        const requestedForWithdrawal = stack.readBigNumber().toString();

        const sudoer = asAddressFriendly(stack.readAddress());
        const sudoerSetAt = new Date(stack.readNumber() * 1000);
        const governor = asAddressFriendly(stack.readAddress());
        const governorUpdateAfter = asUpdateAfter(stack.readNumber());
        const interestManager = asAddressFriendly(stack.readAddress());
        const halter = asAddressFriendly(stack.readAddress());
        const approver = asAddressFriendly(stack.readAddress());

        const controllerCode = stack.readCell();
        const poolJettonWalletCode = stack.readCell();
        const payoutMinterCode = stack.readCell();

        const projectedTotalBalance = stack.readBigNumber().toString();
        const projectedPoolSupply = stack.readBigNumber().toString();

        return {
            state,
            halted,
            totalBalance,
            interestRatePercent,
            optimisticDepositWithdrawals,
            depositsOpen,
            savedValidatorSetHash,
            prevRound,
            currentRound,

            minLoan,
            maxLoan,
            governanceFeePercent,

            jettonMinter,
            supply,

            depositPayout,
            requestedForDeposit,
            withdrawalPayout,
            requestedForWithdrawal,

            sudoer,
            sudoerSetAt,
            governor,
            governorUpdateAfter,
            interestManager,
            halter,
            approver,

            controllerCode,
            poolJettonWalletCode,
            payoutMinterCode,

            projectedTotalBalance,
            projectedPoolSupply,
        };
    }

    async getPoolData(): Promise<PoolSimpleData> {
        const data = await this.client.runGetMethod(this.address, 'get_pool_data');
        const stack = ReaderStack(data.stack);
        const state = stack.readNumber() as PoolState;
        const halted = stack.readBoolean();
        const totalBalance = stack.readBigNumber().toString();
        const supply = stack.readBigNumber().toString();
        const interestRatePercent = (stack.readNumber() / SHARE_BASIS) * 100;

        return {
            state,
            halted,
            totalBalance,
            supply,
            interestRatePercent,
        };
    }

    async getJettonWalletAddress(userAddress: UserFriendlyAddress): Promise<UserFriendlyAddress> {
        const { jettonMinter } = await this.getPoolFullData();
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

    async getControllerAddress(id: number, validator: UserFriendlyAddress) {
        const data = await this.client.runGetMethod(
            this.address,
            'get_controller_address',
            SerializeStack([
                { type: 'int', value: BigInt(id) },
                { type: 'slice', cell: beginCell().storeAddress(Address.parse(validator)).endCell() },
            ]),
        );
        const stack = ReaderStack(data.stack);
        return stack.readAddress();
    }

    /**
     * Build stake message payload.
     *
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

    calculateApy(interestRate: number): number {
        const cyclesPerYear = TIMING.CYCLES_PER_YEAR;
        const protocolFee = TIMING.PROTOCOL_FEE;
        return interestRate * cyclesPerYear * (1 - protocolFee);
    }

    /**
     * Get staking contract balance (instant liquidity available).
     */
    async getPoolBalance(): Promise<bigint> {
        const balance = await this.client.getBalance(this.address);
        return BigInt(balance);
    }

    /**
     * Get round timestamps from pool data.
     * Note: Toncenter doesn't provide cycle_start/cycle_end directly,
     * so we estimate based on cycle length (~18 hours).
     */
    async getRoundInfo(): Promise<RoundInfo> {
        const cycleLengthSeconds = TIMING.CYCLE_LENGTH_HOURS * 3600;
        const now = Math.floor(Date.now() / 1000);
        const cycle_end = now + Math.floor(cycleLengthSeconds / 2);
        const cycle_start = cycle_end - cycleLengthSeconds;

        return {
            cycle_start,
            cycle_end,
            cycle_length: cycleLengthSeconds,
        };
    }
}
