/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { OptionSwitcher } from '@ton/appkit-react';
import type { OptionSwitcherOption } from '@ton/appkit-react';

const options: OptionSwitcherOption[] = [
    { value: 'all', label: 'All tokens' },
    { value: 'verified', label: 'Verified only' },
    { value: 'mine', label: 'My holdings' },
];

export const OptionSwitcherExample = () => {
    const [value, setValue] = useState('all');
    // SAMPLE_START: OPTION_SWITCHER
    return <OptionSwitcher value={value} options={options} onChange={setValue} />;
    // SAMPLE_END: OPTION_SWITCHER
};
