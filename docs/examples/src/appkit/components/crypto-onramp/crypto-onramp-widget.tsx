/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CryptoOnrampWidget } from '@ton/appkit-react';

export const CryptoOnrampWidgetExample = () => {
    // SAMPLE_START: CRYPTO_ONRAMP_WIDGET
    // Uses built-in defaults for tokens, payment methods and chain display info.
    // Make sure a crypto-onramp provider (Layerswap / swaps.xyz) is registered on AppKit.
    return <CryptoOnrampWidget defaultTokenId="ton" />;
    // SAMPLE_END: CRYPTO_ONRAMP_WIDGET
};
