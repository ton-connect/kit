/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface EmulationAction {
    traceId: string | null;
    actionId: string;
    startLt: string;
    endLt: string;
    startUtime: number;
    endUtime: number;
    traceEndLt: string;
    traceEndUtime: number;
    traceMcSeqnoEnd: number;
    transactions: string[];
    isSuccess: boolean;
    type: string;
    traceExternalHash: string;
    accounts: string[];
    details: Record<string, unknown>;
}
