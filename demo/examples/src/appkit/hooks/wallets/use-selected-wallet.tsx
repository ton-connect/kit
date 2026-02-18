/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSelectedWallet } from '@ton/appkit-react';

export const UseSelectedWalletExample = () => {
    // SAMPLE_START: USE_SELECTED_WALLET
    const [wallet, setSelectedWallet] = useSelectedWallet();

    return (
        <div>
            {wallet ? (
                <div>
                    <p>Current Wallet: {wallet.getAddress()}</p>
                    <button onClick={() => setSelectedWallet(null)}>Deselect Wallet</button>
                </div>
            ) : (
                <p>No wallet selected</p>
            )}
        </div>
    );
    // SAMPLE_END: USE_SELECTED_WALLET
};
