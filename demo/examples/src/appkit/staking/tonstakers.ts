/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, registerProvider, ApiClientToncenter, getApiClient } from '@ton/appkit';
import { TonStakersStakingProvider } from '@ton/appkit/staking/tonstakers';

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
        providers: [
            new TonStakersStakingProvider({
                [network.chainId]: {
                    apiClient: toncenterApiClient,
                },
            }),
        ],
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
    const apiClient = getApiClient(appKit, { network: Network.mainnet() });
    registerProvider(
        appKit,
        new TonStakersStakingProvider({
            [Network.mainnet().chainId]: {
                apiClient,
            },
        }),
    );
    // SAMPLE_END: STAKING_PROVIDER_REGISTER

    return appKit;
};
