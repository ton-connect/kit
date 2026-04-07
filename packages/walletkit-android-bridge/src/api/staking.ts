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

type KitWithStaking = {
    staking: {
        register(provider: StakingProviderInterface): void;
        setDefaultProvider(providerId: string): void;
        getQuote(params: StakingQuoteParams, providerId?: string): Promise<unknown>;
        buildStakeTransaction(params: StakeParams, providerId?: string): Promise<unknown>;
        getStakedBalance(userAddress: string, network?: unknown, providerId?: string): Promise<unknown>;
        getStakingProviderInfo(network?: unknown, providerId?: string): Promise<unknown>;
        getSupportedUnstakeModes(providerId?: string): Promise<string[]>;
    };
    createFactoryContext(): Parameters<typeof TonStakersStakingProvider.createFromContext>[0];
};

async function getKitWithStaking(): Promise<KitWithStaking> {
    const instance = await getKit();
    return instance as unknown as KitWithStaking;
}

export async function createTonStakersStakingProvider(args?: { config?: TonStakersProviderConfig }) {
    const instance = await getKitWithStaking();
    const provider = TonStakersStakingProvider.createFromContext(instance.createFactoryContext(), args?.config ?? {});
    const providerId = retain('stakingProvider', provider);
    return { providerId };
}

export async function registerStakingProvider(args: { providerId: string }) {
    const provider = get<StakingProviderInterface>(args.providerId);
    if (!provider) throw new Error(`Staking provider not found: ${args.providerId}`);
    const instance = await getKitWithStaking();
    instance.staking.register(provider);
    return { ok: true };
}

export async function setDefaultStakingProvider(args: { providerId: string }) {
    const instance = await getKitWithStaking();
    instance.staking.setDefaultProvider(args.providerId);
    return { ok: true };
}

export async function getStakingQuote(args: {
    direction: string;
    amount: string;
    userAddress?: string;
    network?: { chainId: string };
    unstakeMode?: string;
    providerOptions?: unknown;
    providerId?: string;
}) {
    const instance = await getKitWithStaking();
    const params: StakingQuoteParams = {
        direction: args.direction as StakingQuoteParams['direction'],
        amount: args.amount,
        userAddress: args.userAddress as StakingQuoteParams['userAddress'],
        network: args.network as StakingQuoteParams['network'],
        unstakeMode: args.unstakeMode as StakingQuoteParams['unstakeMode'],
        providerOptions: args.providerOptions,
    };
    return instance.staking.getQuote(params, args.providerId);
}

export async function buildStakeTransaction(args: {
    quote: StakeParams['quote'];
    userAddress: string;
    providerOptions?: unknown;
    providerId?: string;
}) {
    const instance = await getKitWithStaking();
    const params: StakeParams = {
        quote: args.quote,
        userAddress: args.userAddress as StakeParams['userAddress'],
        providerOptions: args.providerOptions,
    };
    return instance.staking.buildStakeTransaction(params, args.providerId);
}

export async function getStakedBalance(args: {
    userAddress: string;
    network?: { chainId: string };
    providerId?: string;
}) {
    const instance = await getKitWithStaking();
    return instance.staking.getStakedBalance(args.userAddress, args.network, args.providerId);
}

export async function getStakingProviderInfo(args: {
    network?: { chainId: string };
    providerId?: string;
}) {
    const instance = await getKitWithStaking();
    return instance.staking.getStakingProviderInfo(args.network, args.providerId);
}

export async function getSupportedUnstakeModes(args: { providerId?: string }) {
    const instance = await getKitWithStaking();
    return instance.staking.getSupportedUnstakeModes(args.providerId);
}
