/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import type { TonApiAccountEvent } from './events';
import type { TonApiTrace } from './traces';
// import type { TonApiTransaction } from './transactions';

export interface TonApiJettonQuantity {
    quantity: string;
    jetton: {
        address: string;
        name?: string;
        symbol?: string;
        decimals?: number;
    };
}

export interface TonApiRisk {
    transfer_all_remaining_balance: boolean;
    ton: number;
    jettons: TonApiJettonQuantity[];
    nfts: unknown[];
}

export type TonApiMessageConsequences = TonApiTrace;
//  {

// transaction: TonApiTransaction;
// children: {
//     transaction: TonApiTransaction;
//     children: TonApiMessageConsequences[];
// }[];
// trace: TonApiTrace;
// risk: TonApiRisk;
// event: TonApiAccountEvent;
// }
