/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { Button } from '@ton/appkit-react';

export const ButtonExample = () => {
    // SAMPLE_START: BUTTON
    return (
        <Button size="m" variant="fill" onClick={() => console.log('Clicked')}>
            Send transaction
        </Button>
    );
    // SAMPLE_END: BUTTON
};
