import { ExtraCurrency, TupleReader } from '@ton/core';

export type AccountState = 'active' | 'uninitialized' | 'frozen';

export interface TransactionId {
    lt: bigint;
    hash: bigint;
}

export interface BlockId {
    workchain: number;
    shard: bigint;
    seqno: number;
    rootHash: bigint;
    fileHash: bigint;
}

export interface FullAccountState {
    state: AccountState;
    balance: bigint;
    extraCurrencies: ExtraCurrency;
    code: Uint8Array | null;
    data: Uint8Array | null;
    lastTransaction: TransactionId | null;
    blockId: BlockId;
    frozenHash?: bigint;
    timestampt: number;
}

export interface GetResult {
    gasUsed: number;
    stack: TupleReader;
    exitCode: number;
    lastTransaction: TransactionId | null;
    blockId: BlockId;
}

export interface EstimatedFee {
    fwdFee: number;
    gasFee: number;
    inFwdFee: number;
    storageFee: number;
}
