/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationMessage } from './EmulationMessage';

export type EmulationAccountStatus = 'active' | 'frozen' | 'uninit' | string;

export interface EmulationAccountState {
    hash: string;
    balance: string;
    extraCurrencies: Record<string, string> | null;
    accountStatus: EmulationAccountStatus;
    frozenHash: string | null;
    dataHash: string | null;
    codeHash: string | null;
}

export interface EmulationBlockRef {
    workchain: number;
    shard: string;
    seqno: number;
}

export interface EmulationTransactionDescription {
    type: string;
    isAborted: boolean;
    isDestroyed: boolean;
    isCreditFirst: boolean;
    isTock: boolean;
    isInstalled: boolean;
    storagePhase: {
        storageFeesCollected: string;
        statusChange: string;
    };
    creditPhase?: {
        credit: string;
    };
    computePhase: {
        isSkipped: boolean;
        isSuccess: boolean;
        isMsgStateUsed: boolean;
        isAccountActivated: boolean;
        gasFees: string;
        gasUsed: string;
        gasLimit: string;
        gasCredit?: string;
        mode: number;
        exitCode: number;
        vmSteps: number;
        vmInitStateHash?: string;
        vmFinalStateHash?: string;
    };
    actionPhase?: {
        isSuccess: boolean;
        isValid: boolean;
        hasNoFunds: boolean;
        statusChange: string;
        totalFwdFees?: string;
        totalActionFees?: string;
        resultCode: number;
        totalActions: number;
        specActions: number;
        skippedActions: number;
        msgsCreated: number;
        actionListHash?: string;
        totalMsgSize: { cells: string; bits: string };
    };
}

export interface EmulationTransaction {
    account: string;
    hash: string;
    lt: string;
    now: number;
    mcBlockSeqno: number;
    traceExternalHash: string;
    prevTransHash: string | null;
    prevTransLt: string | null;
    origStatus: EmulationAccountStatus;
    endStatus: EmulationAccountStatus;
    totalFees: string;
    totalFeesExtraCurrencies: Record<string, string>;
    description: EmulationTransactionDescription;
    blockRef: EmulationBlockRef;
    inMsg: EmulationMessage | null;
    outMsgs: EmulationMessage[];
    accountStateBefore: EmulationAccountState;
    accountStateAfter: EmulationAccountState;
    isEmulated: boolean;
    traceId?: string;
}
