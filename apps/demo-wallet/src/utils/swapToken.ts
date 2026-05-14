/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Jetton, SwapToken } from '@ton/walletkit';

import { getJettonsSymbol } from '@/utils/jetton';
import { USDT_ADDRESS } from '@/constants/swap';

/**
 * Single source of truth for resolving a human-readable symbol from a `SwapToken`.
 *
 * Priority:
 *   1. The symbol baked into the token (e.g. when seeded by the swap page).
 *   2. Hardcoded well-known addresses (TON, USDT) so the UI looks right even
 *      if a caller forgets to pass `symbol`.
 *   3. The user's loaded jetton list (covers any jetton they actually hold).
 *   4. `'Unknown'` as a last-resort fallback.
 */
export function resolveTokenSymbol(token: SwapToken, userJettons: Jetton[] = []): string {
    if (token.symbol) return token.symbol;
    if (token.address === 'ton') return 'TON';
    if (token.address === USDT_ADDRESS) return 'USDT';

    const jetton = userJettons.find((j) => j.address === token.address);
    if (jetton) {
        const symbol = getJettonsSymbol(jetton);
        if (symbol) return symbol;
    }

    return 'Unknown';
}
