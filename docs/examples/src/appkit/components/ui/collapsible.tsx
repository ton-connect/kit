/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Collapsible } from '@ton/appkit-react';

export const CollapsibleExample = () => {
    const [open, setOpen] = useState(false);
    // SAMPLE_START: COLLAPSIBLE
    return (
        <div>
            <button onClick={() => setOpen((prev) => !prev)}>{open ? 'Hide details' : 'Show details'}</button>
            <Collapsible open={open}>
                <p>Hidden details about the transaction.</p>
            </Collapsible>
        </div>
    );
    // SAMPLE_END: COLLAPSIBLE
};
