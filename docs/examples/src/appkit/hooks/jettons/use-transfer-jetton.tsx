/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTransferJetton } from '@ton/appkit-react';

export const UseTransferJettonExample = () => {
    // SAMPLE_START: USE_TRANSFER_JETTON
    const { mutate: transfer, isPending, error } = useTransferJetton();

    const handleTransfer = () => {
        transfer({
            recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            amount: '100', // 100 USDT
            jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
            jettonDecimals: 6,
        });
    };

    return (
        <div>
            <button onClick={handleTransfer} disabled={isPending}>
                {isPending ? 'Transferring...' : 'Transfer Jetton'}
            </button>
            {error && <div>Error: {error.message}</div>}
        </div>
    );
    // SAMPLE_END: USE_TRANSFER_JETTON
};
