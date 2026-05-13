/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { useState } from 'react';
import { LowBalanceModal } from '@ton/appkit-react';

export const LowBalanceModalExample = () => {
    const [open, setOpen] = useState(true);
    // SAMPLE_START: LOW_BALANCE_MODAL
    return (
        <LowBalanceModal
            open={open}
            mode="reduce"
            requiredTon="0.423"
            onChange={() => {
                console.log('Reduce amount to fit balance');
                setOpen(false);
            }}
            onCancel={() => setOpen(false)}
        />
    );
    // SAMPLE_END: LOW_BALANCE_MODAL
};
