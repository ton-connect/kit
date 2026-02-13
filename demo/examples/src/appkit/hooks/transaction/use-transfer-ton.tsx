/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTransferTon } from '@ton/appkit-react';

export const UseTransferTonExample = () => {
    // SAMPLE_START: USE_TRANSFER_TON
    const { mutate: transferTon, isPending, error, data } = useTransferTon();

    const handleTransfer = () => {
        transferTon({
            recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            amount: '1000000000', // 1 TON in nanotons
            comment: 'Hello from AppKit!',
        });
    };

    return (
        <div>
            <button onClick={handleTransfer} disabled={isPending}>
                {isPending ? 'Transferring...' : 'Transfer TON'}
            </button>
            {error && <div>Error: {error.message}</div>}
            {data && (
                <div>
                    <h4>Transfer Successful!</h4>
                    <p>BOC: {data.boc}</p>
                </div>
            )}
        </div>
    );
    // SAMPLE_END: USE_TRANSFER_TON
};
