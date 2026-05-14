/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { AmountPresets } from '@ton/appkit-react';
import type { AmountPreset } from '@ton/appkit-react';

const presets: AmountPreset[] = [
    { label: '10', amount: '10' },
    { label: '50', amount: '50' },
    { label: '100', amount: '100' },
];

export const AmountPresetsExample = () => {
    const [amount, setAmount] = useState('');
    // SAMPLE_START: AMOUNT_PRESETS
    return (
        <div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <AmountPresets presets={presets} currencySymbol="$" onPresetSelect={setAmount} />
        </div>
    );
    // SAMPLE_END: AMOUNT_PRESETS
};
