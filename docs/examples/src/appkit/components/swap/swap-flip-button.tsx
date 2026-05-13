/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { SwapFlipButton } from '@ton/appkit-react';

export const SwapFlipButtonExample = () => {
    const [rotated, setRotated] = useState(false);
    // SAMPLE_START: SWAP_FLIP_BUTTON
    // Drop it between the source and target `SwapField` rows; wire `onClick` to your token-flip handler.
    return <SwapFlipButton rotated={rotated} onClick={() => setRotated((prev) => !prev)} />;
    // SAMPLE_END: SWAP_FLIP_BUTTON
};
