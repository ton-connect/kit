/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';

export type AgentStatus = 'active' | 'revoked';

export interface AgentWallet {
    id: string;
    name: string;
    address: string;
    operatorPubkey: string;
    originOperatorPublicKey: string;
    ownerAddress: string;
    createdAt: string;
    detectedAt: string;
    isNew: boolean;
    status: AgentStatus;
    source: string;
    collectionAddress?: string;
    nftItemContent: Cell | null;
}
