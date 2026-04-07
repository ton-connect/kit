/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingProviderInterface, StakingQuoteParams, StakeParams } from '@ton/walletkit';
import { TonStakersStakingProvider } from '@ton/walletkit/staking/tonstakers';
import type { TonStakersProviderConfig } from '@ton/walletkit/staking/tonstakers';

import { getKit } from '../utils/bridge';
import { retain, get } from '../utils/registry';

export async function createTonStakersStakingProvider(args?: { config?: TonStakersProviderConfig }) {
    const instance = await getKit();
    const provider = TonStakersStakingProvider.createFromContext(instance.createFactoryContext(), args?.config ?? {});
    const providerId = retain('stakingProvider', provider);
    return { providerId };
}

export async function registerStakingProvider(args: { providerId: string }) {
    const provider = get<StakingProviderInterface>(args.providerId);
    if (!provider) throw new Error(`Staking provider not found: ${args.providerId}`);
    const instance = await getKit();
    instance.staking.registerProvider(provider);
}

export async function setDefaultStakingProvider(args: { providerId: string }) {
    const instance = await getKit();
    instance.staking.setDefaultProvider(args.providerId);
}

export async function getStakingQuote(args: StakingQuoteParams & { providerId?: string }) {
    const { providerId, ...params } = args;
    const instance = await getKit();
    return instance.staking.getQuote(params, providerId);
}

export async function buildStakeTransaction(args: StakeParams & { providerId?: string }) {
    const { providerId, ...params } = args;
    const instance = await getKit();
    return instance.staking.buildStakeTransaction(params, providerId);
}

export async function getStakedBalance(args: {
    userAddress: string;
    network?: { chainId: string };
    providerId?: string;
}) {
    const instance = await getKit();
    return instance.staking.getStakedBalance(args.userAddress, args.network, args.providerId);
}

export async function getStakingProviderInfo(args: { network?: { chainId: string }; providerId?: string }) {
    const instance = await getKit();
    return instance.staking.getStakingProviderInfo(args.network, args.providerId);
}

export async function getSupportedUnstakeModes(args: { providerId?: string }) {
    const instance = await getKit();
    return instance.staking.getSupportedUnstakeModes(args.providerId);
}
