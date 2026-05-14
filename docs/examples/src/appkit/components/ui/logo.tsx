/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Logo } from '@ton/appkit-react';

export const LogoExample = () => {
    // SAMPLE_START: LOGO
    return <Logo size={48} src="https://ton.org/download/ton_symbol.png" alt="TON" fallback="T" />;
    // SAMPLE_END: LOGO
};
