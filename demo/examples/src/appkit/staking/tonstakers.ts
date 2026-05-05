/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, registerProvider, ApiClientToncenter } from '@ton/appkit';
import { createTonstakersProvider } from '@ton/appkit/staking/tonstakers';

export const stakingProviderInitExample = async () => {
    // SAMPLE_START: STAKING_PROVIDER_INIT
    // Initialize AppKit with staking providers
    const network = Network.mainnet();
    const toncenterApiClient = new ApiClientToncenter({ network });
    const appKit = new AppKit({
        networks: {
            [network.chainId]: {
                apiClient: toncenterApiClient,
            },
        },
        providers: [createTonstakersProvider()],
    });
    // SAMPLE_END: STAKING_PROVIDER_INIT

    return appKit;
};

export const stakingProviderRegisterExample = async () => {
    // SAMPLE_START: STAKING_PROVIDER_REGISTER
    // 1. Initialize AppKit
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
        },
    });

    // 2. Register staking providers
    registerProvider(appKit, createTonstakersProvider());
    // SAMPLE_END: STAKING_PROVIDER_REGISTER

    return appKit;
};
