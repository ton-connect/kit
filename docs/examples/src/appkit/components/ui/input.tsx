/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Input } from '@ton/appkit-react';

export const InputExample = () => {
    const [value, setValue] = useState('');
    // SAMPLE_START: INPUT
    return (
        <Input size="m">
            <Input.Header>
                <Input.Title>Recipient</Input.Title>
            </Input.Header>
            <Input.Field>
                <Input.Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="EQ..." />
            </Input.Field>
            <Input.Caption>Paste a TON wallet address.</Input.Caption>
        </Input>
    );
    // SAMPLE_END: INPUT
};
