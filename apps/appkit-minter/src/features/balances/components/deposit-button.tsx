/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { FC } from 'react';
import { Button, useConnectedWallets } from '@ton/appkit-react';
import { ArrowRightLeft } from 'lucide-react';

import { DepositModal } from './deposit-modal';

export const DepositButton: FC = () => {
    const wallets = useConnectedWallets();
    const [isOpen, setIsOpen] = useState(false);

    if (wallets.length < 2) return null;

    return (
        <>
            <Button
                size="icon"
                variant="bezeled"
                onClick={() => setIsOpen(true)}
                title="Deposit between wallets"
                aria-label="Deposit between wallets"
            >
                <ArrowRightLeft size={16} />
            </Button>
            <DepositModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
