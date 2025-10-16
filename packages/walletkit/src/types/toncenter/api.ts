import { AccountStatus, ExtraCurrency, TupleReader } from '@ton/core';

import { Hash } from '../primitive';

export interface TransactionId {
    lt: string;
    hash: Hash;
}

export interface FullAccountState {
    status: AccountStatus;
    balance: string;
    extraCurrencies: ExtraCurrency;
    code: string | null; // base64 encoded
    data: string | null; // base64 encoded
    lastTransaction: TransactionId | null;
    frozenHash?: Hash;
}

export interface GetResult {
    gasUsed: number;
    stack: TupleReader;
    exitCode: number;
}
