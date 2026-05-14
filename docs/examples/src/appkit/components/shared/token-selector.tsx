/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { TokenSelector } from '@ton/appkit-react';

export const TokenSelectorExample = () => {
    // SAMPLE_START: TOKEN_SELECTOR
    return (
        <TokenSelector
            title="TON"
            icon="https://ton.org/download/ton_symbol.png"
            iconFallback="T"
            onClick={() => console.log('Open token picker')}
        />
    );
    // SAMPLE_END: TOKEN_SELECTOR
};
