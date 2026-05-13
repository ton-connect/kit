/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { InfoBlock } from '@ton/appkit-react';

export const InfoBlockExample = () => {
    // SAMPLE_START: INFO_BLOCK
    return (
        <InfoBlock.Container>
            <InfoBlock.Row>
                <InfoBlock.Label>Rate</InfoBlock.Label>
                <InfoBlock.Value>1 TON ≈ $5.43</InfoBlock.Value>
            </InfoBlock.Row>
            <InfoBlock.Row>
                <InfoBlock.Label>Network fee</InfoBlock.Label>
                <InfoBlock.Value>0.01 TON</InfoBlock.Value>
            </InfoBlock.Row>
        </InfoBlock.Container>
    );
    // SAMPLE_END: INFO_BLOCK
};
