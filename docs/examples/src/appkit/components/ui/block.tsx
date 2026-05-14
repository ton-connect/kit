/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Block } from '@ton/appkit-react';

export const BlockExample = () => {
    // SAMPLE_START: BLOCK
    return (
        <Block direction="row">
            <span>Left</span>
            <span>Right</span>
        </Block>
    );
    // SAMPLE_END: BLOCK
};
