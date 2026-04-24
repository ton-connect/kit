/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface EmulationMessage {
    hash: string;
    normalizedHash?: string;
    source: string | null;
    destination: string;
    value: string | null;
    valueExtraCurrencies: Record<string, string>;
    fwdFee: string | null;
    ihrFee: string | null;
    createdLt: string | null;
    createdAt: number | null;
    opcode: string | null;
    ihrDisabled: boolean | null;
    isBounce: boolean | null;
    isBounced: boolean | null;
    importFee: string | null;
    messageContent: {
        hash: string;
        body: string;
        decoded: unknown | null;
    };
    initState: unknown | null;
}
