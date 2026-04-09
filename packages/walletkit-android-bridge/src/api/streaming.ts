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

/**
 * Callbacks from active Kotlin-provider subscriptions, keyed by subId.
 * Populated by ProxyStreamingProvider.watch(); consumed by kotlinProviderDispatch.
 */
const kotlinSubCallbacks = new Map<string, (update: unknown) => void>();

/**
 * Proxy that wraps a Kotlin-implemented ITONStreamingProvider.
 * JS streaming manager interacts with it normally; all calls are forwarded
 * to Kotlin via reverse-RPC (bridgeRequest). Updates flow back via kotlinProviderDispatch.
 */
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
        void bridgeRequest('kotlinProviderWatch', { providerId: this.providerId, subId, type, address });
        return () => {
            kotlinSubCallbacks.delete(subId);
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

/**
 * Called by Kotlin when a Kotlin-implemented streaming provider registers itself.
 * Creates a ProxyStreamingProvider and registers it with the JS streaming manager.
 */
export async function registerKotlinStreamingProvider(args: { providerId: string; network: { chainId: string } }) {
    const instance = await getKit();
    const provider = new ProxyStreamingProvider(args.providerId, args.network as unknown as Network);
    retainWithId(args.providerId, provider);
    instance.streaming.registerProvider(() => provider);
}

/**
 * Called by Kotlin to deliver an update from a Kotlin-implemented streaming provider.
 * Routes the update to the stored callback for the given subscriptionId.
 */
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
