/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useConnect, useDisconnect, useSelectedWallet } from '@ton/appkit-react';

export const UseConnectExample = () => {
    // SAMPLE_START: USE_CONNECT
    const [wallet] = useSelectedWallet();
    const { mutate: connect, isPending: isConnecting, error: connectError } = useConnect();
    const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();

    if (wallet) {
        return (
            <div>
                <button
                    onClick={() => {
                        disconnect({ connectorId: wallet.connectorId });
                    }}
                    disabled={isDisconnecting}
                >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
            </div>
        );
    }

    return (
        <div>
            <button onClick={() => connect({ connectorId: 'tonconnect' })} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {connectError && <div>Error: {connectError.message}</div>}
        </div>
    );
    // SAMPLE_END: USE_CONNECT
};
