/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useDisconnect, useSelectedWallet } from '@ton/appkit-react';

export const UseDisconnectExample = () => {
    // SAMPLE_START: USE_DISCONNECT
    const [wallet] = useSelectedWallet();
    const { mutate: disconnect, isPending, error } = useDisconnect();

    if (!wallet) {
        return <div>Wallet not connected</div>;
    }

    return (
        <div>
            <p>Connected: {wallet.getAddress()}</p>
            <button
                onClick={() => {
                    disconnect({ connectorId: wallet.connectorId });
                }}
                disabled={isPending}
            >
                {isPending ? 'Disconnecting...' : 'Disconnect'}
            </button>
            {error && <div>Error: {error.message}</div>}
        </div>
    );
    // SAMPLE_END: USE_DISCONNECT
};
