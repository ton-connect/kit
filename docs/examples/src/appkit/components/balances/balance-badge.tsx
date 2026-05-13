/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BalanceBadge } from '@ton/appkit-react';

export const BalanceBadgeExample = () => {
    // SAMPLE_START: BALANCE_BADGE
    return (
        <BalanceBadge.Container>
            <BalanceBadge.Icon size={32} src="https://ton.org/download/ton_symbol.png" alt="TON" />
            <BalanceBadge.BalanceBlock>
                <BalanceBadge.Balance balance="1234500000" decimals={9} />
                <BalanceBadge.Symbol symbol="TON" />
            </BalanceBadge.BalanceBlock>
        </BalanceBadge.Container>
    );
    // SAMPLE_END: BALANCE_BADGE
};
