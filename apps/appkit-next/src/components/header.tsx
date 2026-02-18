/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { TonConnectButton } from '@ton/appkit-react';
import type { FC } from 'react';

export const Header: FC = () => {
    return (
        <div className="flex">
            <TonConnectButton />
        </div>
    );
};
