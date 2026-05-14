/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Select } from '@ton/appkit-react';

export const SelectExample = () => {
    const [value, setValue] = useState('mainnet');
    // SAMPLE_START: SELECT
    return (
        <Select.Root value={value} onValueChange={setValue}>
            <Select.Trigger>{value === 'mainnet' ? 'Mainnet' : 'Testnet'}</Select.Trigger>
            <Select.Content>
                <Select.Item value="mainnet">Mainnet</Select.Item>
                <Select.Item value="testnet">Testnet</Select.Item>
            </Select.Content>
        </Select.Root>
    );
    // SAMPLE_END: SELECT
};
