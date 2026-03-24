/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly } from '../../../utils';
import { formatUnits } from '../../../utils/units';
import type { JettonUpdate } from '../../../api/models';
import type { StreamingV2JettonsNotification } from '../types';

export const mapJettons = (notification: StreamingV2JettonsNotification): JettonUpdate => {
    const { address, owner, jetton: masterJetton, balance } = notification.jetton;
    const meta = notification.metadata?.[masterJetton];
    const tokenInfo = meta?.token_info?.find((t) => t.type === 'jetton_masters');
    const decimalsStr = tokenInfo?.extra?.decimals;
    const decimals = typeof decimalsStr === 'string' ? parseInt(decimalsStr, 10) : undefined;

    let formattedBalance: string | undefined;
    if (decimals !== undefined && !isNaN(decimals) && balance) {
        formattedBalance = formatUnits(balance, decimals);
    }

    return {
        type: 'jettons',
        masterAddress: asAddressFriendly(masterJetton),
        walletAddress: asAddressFriendly(address),
        ownerAddress: asAddressFriendly(owner),
        rawBalance: balance,
        decimals,
        balance: formattedBalance,
        status: notification.finality,
    };
};
