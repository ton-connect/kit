/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import {
    getStakingQuote,
    buildStakeTransaction,
    getStakedBalance,
    getStakingProviders,
    getStakingProviderInfo,
} from '@ton/appkit';

export const stakingExample = async (appKit: AppKit) => {
    const userAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

    // SAMPLE_START: GET_STAKING_PROVIDERS
    const providers = await getStakingProviders(appKit);
    console.log('Available Staking Providers:', providers);
    // SAMPLE_END: GET_STAKING_PROVIDERS

    // SAMPLE_START: GET_STAKING_PROVIDER_INFO
    const providerInfo = await getStakingProviderInfo(appKit, {
        providerId: 'tonstakers',
    });
    console.log('Provider Info:', providerInfo);
    // SAMPLE_END: GET_STAKING_PROVIDER_INFO

    // SAMPLE_START: GET_STAKING_QUOTE
    const quote = await getStakingQuote(appKit, {
        amount: '1000000000',
        direction: 'stake',
    });
    console.log('Staking Quote:', quote);
    // SAMPLE_END: GET_STAKING_QUOTE

    // SAMPLE_START: BUILD_STAKE_TRANSACTION
    const txRequest = await buildStakeTransaction(appKit, {
        quote,
        userAddress,
    });
    console.log('Stake Transaction:', txRequest);
    // SAMPLE_END: BUILD_STAKE_TRANSACTION

    // SAMPLE_START: GET_STAKED_BALANCE
    const balance = await getStakedBalance(appKit, {
        userAddress,
    });
    console.log('Staked Balance:', balance);
    // SAMPLE_END: GET_STAKED_BALANCE
};
