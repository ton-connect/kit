/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CopyButton } from '@ton/appkit-react';

export const CopyButtonExample = () => {
    // SAMPLE_START: COPY_BUTTON
    return <CopyButton value="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c" aria-label="Copy wallet address" />;
    // SAMPLE_END: COPY_BUTTON
};
