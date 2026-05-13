/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Modal } from '@ton/appkit-react';

export const ModalExample = () => {
    const [open, setOpen] = useState(false);
    // SAMPLE_START: MODAL
    return (
        <div>
            <button onClick={() => setOpen(true)}>Open modal</button>
            <Modal open={open} onOpenChange={setOpen} title="Confirm action">
                <p>Are you sure you want to proceed?</p>
            </Modal>
        </div>
    );
    // SAMPLE_END: MODAL
};
