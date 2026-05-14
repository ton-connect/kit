/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StakingWidget } from '@ton/appkit-react';

export const StakingWidgetExample = () => {
    // SAMPLE_START: STAKING_WIDGET
    // Falls back to the connected wallet's network when `network` is omitted.
    // Make sure a staking provider (e.g. Tonstakers) is registered on AppKit.
    return <StakingWidget />;
    // SAMPLE_END: STAKING_WIDGET
};
