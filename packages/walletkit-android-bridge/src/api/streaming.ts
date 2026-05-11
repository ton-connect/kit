/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    BalanceUpdate,
    JettonUpdate,
    Network,
    StreamingProvider,
    StreamingUpdate,
    StreamingWatchType,
    TonApiStreamingProviderConfig,
    TonCenterStreamingProviderConfig,
    TransactionsUpdate,
} from '@ton/walletkit';
import { TonApiStreamingProvider, TonCenterStreamingProvider } from '@ton/walletkit';
import { v7 as uuidv7 } from 'uuid';

import { emit } from '../transport/messaging';
import { bridgeRequest } from '../transport/nativeBridge';
import { getKit } from '../utils/bridge';
import { get, release, retain, retainWithId } from '../utils/registry';

const kotlinSubCallbacks = new Map<string, (update: unknown) => void>();
const kotlinProviderSubs = new Map<string, Set<string>>();

type InternalStreamingManager = {
    providers: Map<string, StreamingProvider>;
    providerConnectionUnsubs: Map<string, () => void>;
};

function trackKotlinSub(providerId: string, subId: string): void {
    let subs = kotlinProviderSubs.get(providerId);
    if (!subs) {
        subs = new Set<string>();
        kotlinProviderSubs.set(providerId, subs);
    }
    subs.add(subId);
}

function forgetKotlinSub(providerId: string, subId: string): void {
    const subs = kotlinProviderSubs.get(providerId);
    if (!subs) return;
    subs.delete(subId);
    if (subs.size === 0) {
        kotlinProviderSubs.delete(providerId);
    }
}

function cleanupReplacedKotlinProvider(
    instance: { streaming: unknown },
    nextProviderId: string,
    network: { chainId: string },
): void {
    const manager = instance.streaming as InternalStreamingManager;
    const networkId = String(network.chainId);
    const previousProvider = manager.providers.get(networkId);
    if (!(previousProvider instanceof ProxyStreamingProvider)) {
        return;
    }

    manager.providerConnectionUnsubs.get(networkId)?.();
    manager.providerConnectionUnsubs.delete(networkId);
    manager.providers.delete(networkId);
    previousProvider.dispose();
    if (previousProvider.providerId !== nextProviderId) {
        void bridgeRequest('kotlinProviderRelease', { providerId: previousProvider.providerId });
    }
    release(previousProvider.providerId);
}

class ProxyStreamingProvider implements StreamingProvider {
    readonly type = 'streaming' as const;
    readonly network: Network;

    constructor(
        readonly providerId: string,
        network: Network,
    ) {
        this.network = network;
    }

    private watch(type: string, address: string | null, onChange: (update: unknown) => void): () => void {
        const subId = uuidv7();
        kotlinSubCallbacks.set(subId, onChange);
        trackKotlinSub(this.providerId, subId);
        void bridgeRequest('kotlinProviderWatch', { providerId: this.providerId, subId, type, address });
        return () => {
            kotlinSubCallbacks.delete(subId);
            forgetKotlinSub(this.providerId, subId);
            void bridgeRequest('kotlinProviderUnwatch', { subId });
        };
    }

    watchBalance(address: string, onChange: (update: BalanceUpdate) => void): () => void {
        return this.watch('balance', address, onChange as (update: unknown) => void);
    }

    watchTransactions(address: string, onChange: (update: TransactionsUpdate) => void): () => void {
        return this.watch('transactions', address, onChange as (update: unknown) => void);
    }

    watchJettons(address: string, onChange: (update: JettonUpdate) => void): () => void {
        return this.watch('jettons', address, onChange as (update: unknown) => void);
    }

    onConnectionChange(callback: (connected: boolean) => void): () => void {
        return this.watch('connectionChange', null, callback as (update: unknown) => void);
    }

    connect(): void {
        void bridgeRequest('kotlinProviderConnect', { providerId: this.providerId });
    }

    disconnect(): void {
        void bridgeRequest('kotlinProviderDisconnect', { providerId: this.providerId });
    }

    dispose(): void {
        const subs = kotlinProviderSubs.get(this.providerId);
        if (!subs) return;
        for (const subId of subs) {
            kotlinSubCallbacks.delete(subId);
            void bridgeRequest('kotlinProviderUnwatch', { subId });
        }
        kotlinProviderSubs.delete(this.providerId);
    }
}

export async function createTonCenterStreamingProvider(args: { config: TonCenterStreamingProviderConfig }) {
    const instance = await getKit();
    const provider = new TonCenterStreamingProvider(instance.createFactoryContext(), args.config);
    return { providerId: retain('streamingProvider', provider) };
}

export async function createTonApiStreamingProvider(args: { config: TonApiStreamingProviderConfig }) {
    const instance = await getKit();
    const provider = new TonApiStreamingProvider(instance.createFactoryContext(), args.config);
    return { providerId: retain('streamingProvider', provider) };
}

export async function registerStreamingProvider(args: { providerId: string }) {
    const instance = await getKit();
    const provider = get<StreamingProvider>(args.providerId);
    if (!provider) throw new Error(`Streaming provider not found: ${args.providerId}`);
    instance.streaming.registerProvider(() => provider);
}

export async function streamingHasProvider(args: { network: { chainId: string } }) {
    const instance = await getKit();
    return { hasProvider: instance.streaming.hasProvider(args.network) };
}

export async function streamingWatch(args: {
    network: { chainId: string };
    address: string;
    types: StreamingWatchType[];
}) {
    const instance = await getKit();
    let subscriptionId: string;
    const unwatch = instance.streaming.watch(
        args.network,
        args.address,
        args.types as Exclude<StreamingWatchType, 'trace'>[],
        (_type: StreamingWatchType, update: StreamingUpdate) => {
            emit('streamingUpdate', { subscriptionId, update });
        },
    );
    subscriptionId = retain('streamingSub', unwatch);
    return { subscriptionId };
}

export async function streamingUnwatch(args: { subscriptionId: string }) {
    const unwatch = get<() => void>(args.subscriptionId);
    if (unwatch) {
        unwatch();
        release(args.subscriptionId);
    }
}

export async function streamingConnect() {
    const instance = await getKit();
    instance.streaming.connect();
}

export async function streamingDisconnect() {
    const instance = await getKit();
    instance.streaming.disconnect();
}

export async function streamingWatchConnectionChange(args: { network: { chainId: string } }) {
    const instance = await getKit();
    let subscriptionId: string;
    const unwatch = instance.streaming.onConnectionChange(args.network, (connected: boolean) => {
        emit('streamingConnectionChange', { subscriptionId, connected });
    });
    subscriptionId = retain('streamingSub', unwatch);
    return { subscriptionId };
}

export async function streamingWatchBalance(args: { network: { chainId: string }; address: string }) {
    const instance = await getKit();
    let subscriptionId: string;
    const unwatch = instance.streaming.watchBalance(args.network, args.address, (update) => {
        emit('streamingBalanceUpdate', { subscriptionId, update });
    });
    subscriptionId = retain('streamingSub', unwatch);
    return { subscriptionId };
}

export async function streamingWatchTransactions(args: { network: { chainId: string }; address: string }) {
    const instance = await getKit();
    let subscriptionId: string;
    const unwatch = instance.streaming.watchTransactions(args.network, args.address, (update) => {
        emit('streamingTransactionsUpdate', { subscriptionId, update });
    });
    subscriptionId = retain('streamingSub', unwatch);
    return { subscriptionId };
}

export async function streamingWatchJettons(args: { network: { chainId: string }; address: string }) {
    const instance = await getKit();
    let subscriptionId: string;
    const unwatch = instance.streaming.watchJettons(args.network, args.address, (update) => {
        emit('streamingJettonsUpdate', { subscriptionId, update });
    });
    subscriptionId = retain('streamingSub', unwatch);
    return { subscriptionId };
}

export async function registerKotlinStreamingProvider(args: { providerId: string; network: { chainId: string } }) {
    const instance = await getKit();
    cleanupReplacedKotlinProvider(instance, args.providerId, args.network);
    const provider = new ProxyStreamingProvider(args.providerId, args.network as unknown as Network);
    retainWithId(args.providerId, provider);
    instance.streaming.registerProvider(() => provider);
}

export async function kotlinProviderDispatch(args: { subId: string; updateJson: string }) {
    const callback = kotlinSubCallbacks.get(args.subId);
    if (callback) {
        try {
            callback(JSON.parse(args.updateJson));
        } catch {
            // Ignore malformed update payloads
        }
    }
}
