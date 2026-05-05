/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWatchBalanceByAddress, useBalanceByAddress, Network } from '@ton/appkit-react';

export const UseWatchBalanceByAddressExample = () => {
    // SAMPLE_START: USE_WATCH_BALANCE_BY_ADDRESS
    const address = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';
    const network = Network.mainnet();
    const { data: balance } = useBalanceByAddress({ address, network });

    useWatchBalanceByAddress({ address, network });

    return <div>Current balance: {balance}</div>;
    // SAMPLE_END: USE_WATCH_BALANCE_BY_ADDRESS
};
