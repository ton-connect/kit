/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { CenteredAmountInput } from '@ton/appkit-react';

export const CenteredAmountInputExample = () => {
    const [amount, setAmount] = useState('');
    // SAMPLE_START: CENTERED_AMOUNT_INPUT
    return <CenteredAmountInput value={amount} onValueChange={setAmount} ticker="TON" placeholder="0" />;
    // SAMPLE_END: CENTERED_AMOUNT_INPUT
};
