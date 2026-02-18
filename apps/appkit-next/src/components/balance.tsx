/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { formatUnits } from '@ton/appkit';
import { useBalance } from '@ton/appkit-react';
import type { FC } from 'react';

export const Balance: FC = () => {
    const { data: balance } = useBalance({
        query: {
            refetchInterval: 20000,
        },
    });

    return (
        <div>
            <p className="inline font-bold">Balance: </p>
            <p className="inline">{balance ? `${formatUnits(balance, 9)} TON` : 'Loading...'}</p>
        </div>
    );
};
