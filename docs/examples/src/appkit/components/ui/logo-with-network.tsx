/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LogoWithNetwork } from '@ton/appkit-react';

export const LogoWithNetworkExample = () => {
    // SAMPLE_START: LOGO_WITH_NETWORK
    return (
        <LogoWithNetwork
            size={48}
            src="https://cdn.example.com/usdt.png"
            alt="USDT"
            fallback="U"
            networkSrc="https://ton.org/download/ton_symbol.png"
            networkAlt="TON"
        />
    );
    // SAMPLE_END: LOGO_WITH_NETWORK
};
