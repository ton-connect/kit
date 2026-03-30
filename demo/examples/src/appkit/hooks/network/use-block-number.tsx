/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBlockNumber } from '@ton/appkit-react';

export const UseBlockNumberExample = () => {
    // SAMPLE_START: USE_BLOCK_NUMBER
    const { data: blockNumber } = useBlockNumber();

    return <div>Current block number: {blockNumber}</div>;
    // SAMPLE_END: USE_BLOCK_NUMBER
};
