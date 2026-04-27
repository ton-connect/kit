/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ParseStack } from '@ton/walletkit';
import type { ApiClient } from '@ton/walletkit';

export interface JettonWalletInfo {
    owner: string;
    master: string;
}

function loadAddressFromStackItem(item: ReturnType<typeof ParseStack>[number] | undefined) {
    if (!item || (item.type !== 'slice' && item.type !== 'cell')) return null;
    return item.cell.asSlice().loadAddress();
}

// Returns null on any failure; callers fall back to TON-only metering.
export async function getJettonWalletInfoFromClient(
    client: ApiClient,
    jettonWalletAddress: string,
): Promise<JettonWalletInfo | null> {
    try {
        const result = await client.runGetMethod(jettonWalletAddress, 'get_wallet_data');
        if (result.exitCode !== 0) return null;
        const stack = ParseStack(result.stack);
        const owner = loadAddressFromStackItem(stack[1]);
        const master = loadAddressFromStackItem(stack[2]);
        if (!owner || !master) return null;
        return { owner: owner.toString(), master: master.toString() };
    } catch {
        return null;
    }
}
