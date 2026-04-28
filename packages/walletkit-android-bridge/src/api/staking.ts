/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    Network,
    StakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingProviderInterface,
    StakingQuote,
    StakingQuoteParams,
    TransactionRequest,
    UnstakeModes,
    UserFriendlyAddress,
} from '@ton/walletkit';
import { TonStakersStakingProvider } from '@ton/walletkit/staking/tonstakers';
import type { TonStakersProviderConfig } from '@ton/walletkit/staking/tonstakers';

import { bridgeRequest } from '../transport/nativeBridge';
import { getKit } from '../utils/bridge';
import { get, release, retainWithId } from '../utils/registry';

/**
 * JS-side proxy that implements [StakingProviderInterface] by forwarding every call to a
 * Kotlin-implemented `ITONStakingProvider` via reverse-RPC. Mirrors the streaming
 * `ProxyStreamingProvider` pattern.
 *
 * `getSupportedUnstakeModes` is synchronous per the interface contract, so the supported modes
 * are fetched once at registration and cached on this instance.
 */
class ProxyStakingProvider implements StakingProviderInterface {
    readonly type = 'staking' as const;

    constructor(
        readonly providerId: string,
        private readonly supportedUnstakeModes: UnstakeModes[],
    ) {}

    async getQuote(params: StakingQuoteParams): Promise<StakingQuote> {
        const resultJson = (await bridgeRequest('kotlinStakingProviderGetQuote', {
            providerId: this.providerId,
            params: JSON.stringify(params),
        })) as string;
        return JSON.parse(resultJson) as StakingQuote;
    }

    async buildStakeTransaction(params: StakeParams): Promise<TransactionRequest> {
        const resultJson = (await bridgeRequest('kotlinStakingProviderBuildStakeTransaction', {
            providerId: this.providerId,
            params: JSON.stringify(params),
        })) as string;
        return JSON.parse(resultJson) as TransactionRequest;
    }

    async getStakedBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance> {
        const resultJson = (await bridgeRequest('kotlinStakingProviderGetStakedBalance', {
            providerId: this.providerId,
            userAddress,
            networkChainId: network?.chainId ?? null,
        })) as string;
        return JSON.parse(resultJson) as StakingBalance;
    }

    async getStakingProviderInfo(network?: Network): Promise<StakingProviderInfo> {
        const resultJson = (await bridgeRequest('kotlinStakingProviderGetStakingProviderInfo', {
            providerId: this.providerId,
            networkChainId: network?.chainId ?? null,
        })) as string;
        return JSON.parse(resultJson) as StakingProviderInfo;
    }

    getSupportedUnstakeModes(): UnstakeModes[] {
        return this.supportedUnstakeModes;
    }
}

export async function createTonStakersStakingProvider(args?: { config?: TonStakersProviderConfig }) {
    const instance = await getKit();
    const provider = TonStakersStakingProvider.createFromContext(instance.createFactoryContext(), args?.config ?? {});
    // Retain under the provider's own id (e.g. 'tonstakers') rather than a generated handle, so that
    // the id we hand back to Kotlin matches what StakingManager stores when registerProvider(provider)
    // indexes providers by `provider.providerId`. Mirrors the swap bridge's createOmnistonSwapProvider.
    retainWithId(provider.providerId, provider);
    return { providerId: provider.providerId };
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

/**
 * Tell the JS staking manager that a Kotlin-implemented provider is available.
 * A [ProxyStakingProvider] is created and registered; all subsequent staking operations on it
 * forward to the Kotlin instance via reverse-RPC.
 *
 * @param args.providerId Unique id — matches `identifier.name` on the Kotlin side.
 * @param args.supportedUnstakeModes Cached modes returned synchronously from `getSupportedUnstakeModes`.
 */
export async function registerKotlinStakingProvider(args: {
    providerId: string;
    supportedUnstakeModes: UnstakeModes[];
}) {
    const instance = await getKit();
    // Replace any previous proxy with the same id
    const previous = get<ProxyStakingProvider>(args.providerId);
    if (previous instanceof ProxyStakingProvider) {
        release(args.providerId);
    }
    const provider = new ProxyStakingProvider(args.providerId, args.supportedUnstakeModes);
    retainWithId(args.providerId, provider);
    instance.staking.registerProvider(provider);
}
