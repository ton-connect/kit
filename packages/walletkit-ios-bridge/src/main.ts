/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
    WalletSigner,
    BridgeEventMessageInfo,
    InjectedToExtensionBridgeRequestPayload,
    NetworkAdapters,
    Wallet,
    TransactionRequest,
    TONTransferRequest,
    Network,
    StorageAdapter,
    TONConnectSessionManager,
    JettonsAPI,
    TONConnectSession,
    SignDataApprovalResponse,
    SendTransactionApprovalResponse,
    ConnectionRequestEvent,
    ConnectionApprovalResponse,
    SendTransactionRequestEvent,
    SignDataRequestEvent,
} from '@ton/walletkit';
import { MemoryStorageAdapter, Signer, WalletV4R2Adapter, WalletV5R1Adapter, TonWalletKit } from '@ton/walletkit';
import type { WalletAdapter } from '@ton/walletkit';

import { SwiftStorageAdapter } from './SwiftStorageAdapter';
import { SwiftWalletAdapter } from './SwiftWalletAdapter';
import { SwiftAPIClientAdapter } from './SwiftAPIClientAdapter';
import { SwiftTONConnectSessionsManager } from './SwiftTONConnectSessionsManager';
import type {
    SwiftApiClient,
    SwiftBridgeTransport,
    SwiftWalletKit,
    SwiftWalletKitConfiguration,
    SwiftWalletSigner,
} from './types';

declare global {
    interface Window {
        walletKit?: SwiftWalletKit;
        initWalletKit: (
            configuration: SwiftWalletKitConfiguration,
            storage?: StorageAdapter,
            bridgeTransport?: SwiftBridgeTransport,
            sessionManager?: TONConnectSessionManager,
            apiClients?: SwiftApiClient[],
        ) => Promise<void>;
    }
}

window.initWalletKit = async (configuration, storage, bridgeTransport, sessionManager, apiClients) => {
    console.log('🚀 WalletKit iOS Bridge starting...');

    console.log('Creating WalletKit instance with configuration', configuration);
    console.log('Storage', storage);
    console.log('API Clients', apiClients);

    if (configuration.bridge && bridgeTransport) {
        configuration.bridge.jsBridgeTransport = (sessionID: string, message: any) => {
            bridgeTransport({ sessionID, messageID: message.messageId, message });
        };
    }

    const networks: NetworkAdapters = {};
    if (configuration.networkConfigurations) {
        for (const netConfig of configuration.networkConfigurations) {
            networks[netConfig.network.chainId] = {
                apiClient: netConfig.apiClientConfiguration,
            };
        }
    }

    if (apiClients) {
        for (const apiClient of apiClients) {
            const network = apiClient.getNetwork();
            const client = new SwiftAPIClientAdapter(apiClient);

            console.log('API Client Network', network);

            networks[network.chainId] = {
                apiClient: client,
            };
        }
    }

    const walletKit = new TonWalletKit({
        networks,
        walletManifest: configuration.walletManifest,
        deviceInfo: configuration.deviceInfo,
        sessionManager: sessionManager ? new SwiftTONConnectSessionsManager(sessionManager) : undefined,
        bridge: configuration.bridge,
        eventProcessor: configuration.eventsConfiguration,
        storage: storage ? new SwiftStorageAdapter(storage) : new MemoryStorageAdapter({}),
    });

    console.log('🚀 WalletKit iOS Bridge starting...');

    let initialized = false;

    // Initialize the full WalletKit here in JavaScript
    // Swift will call the JavaScript APIs directly for wallet operations
    // Events from WalletKit will be forwarded to Swift via the bridge

    console.log('🔄 Initializing WalletKit Bridge');

    try {
        await walletKit.ensureInitialized();
    } catch (error) {
        console.error('Failed to initialize WalletKit:', error);
        throw error;
    }

    // WalletKit is already constructed with config, just set up the bridge
    console.log('✅ WalletKit instance ready');

    initialized = true;
    console.log('✅ WalletKit Bridge initialized successfully');

    // Bridge API that Swift will call
    // Main WalletKit logic lives here in JavaScript
    window.walletKit = {
        // Check if initialized
        isReady(): boolean {
            return initialized && !!walletKit;
        },

        jettonsManager(): JettonsAPI {
            return walletKit.jettons;
        },

        setEventsListeners(callback: (type: string, event: unknown) => Promise<void>): void {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🔔 Bridge: Adding event listeners');

            walletKit.onConnectRequest(async (event) => {
                console.log('📨 Connect request received:', event);
                await callback('connectRequest', event);
            });

            walletKit.onTransactionRequest(async (event) => {
                console.log('📨 Transaction request received:', event);
                await callback('transactionRequest', event);
            });

            walletKit.onSignDataRequest(async (event) => {
                console.log('📨 Sign data request received:', event);
                await callback('signDataRequest', event);
            });

            walletKit.onDisconnect(async (event) => {
                console.log('📨 Disconnect event received:', event);
                await callback('disconnect', event);
            });
        },

        removeEventListeners(): void {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🗑️ Bridge: Removing all event listeners');

            walletKit.removeConnectRequestCallback();
            walletKit.removeTransactionRequestCallback();
            walletKit.removeSignDataRequestCallback();
            walletKit.removeDisconnectCallback();

            console.log('🗑️ All event listeners removed');
        },

        async createSignerFromMnemonic(mnemonic: string): Promise<WalletSigner> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating signer from mnemonic');

            if (!mnemonic) {
                throw new Error('Mnemonic is required to create signer');
            }

            return await Signer.fromMnemonic(mnemonic, { type: 'ton' });
        },

        async createSignerFromPrivateKey(privateKey: string): Promise<WalletSigner> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating signer from private key');

            if (!privateKey) {
                throw new Error('Private key is required to create signer');
            }

            return await Signer.fromPrivateKey(privateKey);
        },

        async createV4R2WalletAdapter(
            signer: WalletSigner | SwiftWalletSigner,
            parameters: { network: Network },
        ): Promise<WalletAdapter> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V4R2 wallet using mnemonic');

            const configuredNetworks = walletKit.getConfiguredNetworks();
            const network = configuredNetworks.find((net) => net.chainId === parameters.network.chainId);

            if (!network) {
                throw new Error('Network is required to create V4R2 wallet');
            }

            return await WalletV4R2Adapter.create(this.jsSigner(signer), {
                client: walletKit.getApiClient(network),
                network: network,
            });
        },

        async createV5R1WalletAdapter(
            signer: WalletSigner | SwiftWalletSigner,
            parameters: { network: Network },
        ): Promise<WalletAdapter> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V5R1 wallet using mnemonic');

            const configuredNetworks = walletKit.getConfiguredNetworks();
            const network = configuredNetworks.find((net) => net.chainId === parameters.network.chainId);

            if (!network) {
                throw new Error('Network is required to create V5R1 wallet');
            }

            return await WalletV5R1Adapter.create(this.jsSigner(signer), {
                client: walletKit.getApiClient(network),
                network: network,
            });
        },

        jsSigner(signer: WalletSigner | SwiftWalletSigner): WalletSigner {
            if (isSwiftObject(signer)) {
                const swiftSigner = signer as SwiftWalletSigner;

                return {
                    sign: async (bytes: Iterable<number>) => {
                        return await swiftSigner.sign(bytes);
                    },
                    publicKey: swiftSigner.publicKey(),
                };
            }

            return signer as WalletSigner;
        },

        async processInjectedBridgeRequest(
            messageInfo: BridgeEventMessageInfo,
            request: InjectedToExtensionBridgeRequestPayload,
        ): Promise<unknown> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            return walletKit.processInjectedBridgeRequest(messageInfo, request);
        },

        // Wallet management
        async addWallet(walletAdapter: WalletAdapter): Promise<Wallet | undefined> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('➕ Bridge: Adding wallet:');

            const wallet = await walletKit.addWallet(this.jsWalletAdapter(walletAdapter));

            if (wallet) {
                console.log('✅ Wallet added:', wallet.getAddress());
            } else {
                console.log('✅ Wallet added: undefined');
            }
            return wallet;
        },

        jsWalletAdapter(walletAdapter: WalletAdapter): WalletAdapter {
            if (isSwiftObject(walletAdapter)) {
                return new SwiftWalletAdapter(walletAdapter, walletKit.getApiClient(walletAdapter.getNetwork()));
            }
            return walletAdapter;
        },

        getWallet(address: string): Wallet | undefined {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('🔍 Bridge: Getting wallet for address:', address);
            return walletKit.getWallet(address);
        },

        async removeWallet(address: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('➖ Bridge: Removing wallet:', address);

            try {
                await walletKit.removeWallet(address);
                console.log('✅ Wallet removed');
            } catch (error) {
                console.error('❌ Failed to remove wallet:', error);
                throw error;
            }
        },

        async clearWallets(): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🗑️ Bridge: Clearing all wallets');

            try {
                await walletKit.clearWallets();
                console.log('✅ All wallets cleared');
            } catch (error) {
                console.error('❌ Failed to clear wallets:', error);
                throw error;
            }
        },

        getWallets(): Wallet[] {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('📋 Bridge: Getting wallets');

            return walletKit.getWallets();
        },

        async getSessions(): Promise<TONConnectSession[]> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('📋 Bridge: Getting sessions');

            try {
                const sessions = await walletKit.listSessions();
                console.log('✅ Got sessions:', sessions);
                return sessions;
            } catch (error) {
                console.error('❌ Failed to get sessions:', error);
                throw error;
            }
        },

        // Connection handling
        async handleTonConnectUrl(url: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🔗 Bridge: Handling TON Connect URL:', url);

            try {
                const result = await walletKit.handleTonConnectUrl(url);
                console.log('🔗 Bridge: Handled TON Connect URL:', result);
                return result;
            } catch (error) {
                console.error('❌ Error processing TonConnect URL:', error);
                throw error;
            }
        },

        async approveConnectRequest(
            event: ConnectionRequestEvent,
            response?: ConnectionApprovalResponse,
        ): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving connect request:', event, event.walletAddress);

            try {
                const result = await walletKit.approveConnectRequest(event, response);
                console.log('✅ Connect request approved for wallet:', event.walletAddress, result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve connect request:', error);
                throw error;
            }
        },

        async rejectConnectRequest(event: ConnectionRequestEvent, reason?: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting connect request:', event.id, reason || 'User rejected');

            try {
                const result = await walletKit.rejectConnectRequest(event, reason);
                console.log('✅ Connect request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject connect request:', error);
                throw error;
            }
        },

        // Transaction handling
        async approveTransactionRequest(
            event: SendTransactionRequestEvent,
            response?: SendTransactionApprovalResponse,
        ): Promise<SendTransactionApprovalResponse> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving transaction request:', event);

            try {
                const result = await walletKit.approveTransactionRequest(event, response);
                console.log('✅ Transaction request approved:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve transaction request:', error);
                throw error;
            }
        },

        async rejectTransactionRequest(event: SendTransactionRequestEvent, reason?: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting transaction request:', event, reason);

            try {
                const result = await walletKit.rejectTransactionRequest(event, reason);
                console.log('✅ Transaction request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject transaction request:', error);
                throw error;
            }
        },

        // Sign data handling
        async approveSignDataRequest(
            event: SignDataRequestEvent,
            response?: SignDataApprovalResponse,
        ): Promise<SignDataApprovalResponse> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving sign data request:', event);

            try {
                const result = await walletKit.approveSignDataRequest(event, response);
                console.log('✅ Sign data request approved:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve sign data request:', error);
                throw error;
            }
        },

        async rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting sign data request:', event, reason);

            try {
                const result = await walletKit.rejectSignDataRequest(event, reason);
                console.log('✅ Sign data request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject sign data request:', error);
                throw error;
            }
        },

        // Session management
        async disconnect(sessionId: string): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🔌 Bridge: Disconnecting session:', sessionId);

            try {
                const result = await walletKit.disconnect(sessionId);
                console.log('✅ Session disconnected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to disconnect session:', error);
                throw error;
            }
        },

        async sendTransaction(wallet: Wallet, transaction: TransactionRequest): Promise<void> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🪙 Bridge: Sending transaction:', transaction);

            await walletKit.handleNewTransaction(wallet, transaction);
        },

        async createTransferMultiTonTransaction(
            wallet: Wallet,
            params: [TONTransferRequest],
        ): Promise<TransactionRequest> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🪙 Bridge: Creating multi TON transfer transaction');

            return wallet.createTransferMultiTonTransaction(params);
        },
    };
};

function parseSwiftConstructorPattern(str: string) {
    const match = str.match(/^\[object ([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)Constructor\]$/);

    if (match) {
        return {
            namespace: match[1],
            className: match[2],
            fullName: `${match[1]}.${match[2]}`,
        };
    }

    return null;
}

function isSwiftObject(obj: any) {
    if (obj && obj.constructor) {
        const pattern = parseSwiftConstructorPattern(obj.constructor.toString());
        return pattern !== null;
    }

    return false;
}
