import { AccountStatus, ExtraCurrency, TupleReader } from '@ton/core';

export interface TransactionId {
    lt: bigint;
    hash: bigint;
}

export interface FullAccountState {
    status: AccountStatus;
    balance: bigint;
    extraCurrencies: ExtraCurrency;
    code: Uint8Array | null;
    data: Uint8Array | null;
    lastTransaction: TransactionId | null;
    frozenHash?: bigint;
}

export interface GetResult {
    gasUsed: number;
    stack: TupleReader;
    exitCode: number;
}
