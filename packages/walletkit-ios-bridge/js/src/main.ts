/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    MemoryStorageAdapter,
    Signer,
    WalletV4R2Adapter,
    WalletV5R1Adapter,
    WalletSigner,
    TonWalletKit,
    BridgeEventMessageInfo,
    InjectedToExtensionBridgeRequestPayload,
} from '@ton/walletkit';

import { SwiftStorageAdapter } from './SwiftStorageAdapter';

declare global {
    interface Window {
        walletKit?: any;
        initWalletKit: (configuration, storage, bridgeTransport: (response) => void) => Promise<void>;
    }
}

window.initWalletKit = async (configuration, storage, bridgeTransport) => {
    console.log('🚀 WalletKit iOS Bridge starting...');

    console.log('Creating WalletKit instance with configuration', configuration);
    console.log('Storage', storage);

    configuration.bridge.jsBridgeTransport = (sessionID, message) => {
        bridgeTransport({ sessionID, messageID: message.messageId, message });
    };

    const walletKit = new TonWalletKit({
        network: configuration.network,
        walletManifest: configuration.walletManifest,
        deviceInfo: configuration.deviceInfo,
        bridge: configuration.bridge,
        eventProcessor: {},
        apiClient: configuration.apiClient,

        storage: storage ? new SwiftStorageAdapter(storage) : new MemoryStorageAdapter({}),
    });

    console.log('🚀 WalletKit iOS Bridge starting...');

    let initialized = false;

    // Initialize the full WalletKit here in JavaScript
    // Swift will call the JavaScript APIs directly for wallet operations
    // Events from WalletKit will be forwarded to Swift via the bridge

    console.log('🔄 Initializing WalletKit Bridge');

    // WalletKit is already constructed with config, just set up the bridge
    console.log('✅ WalletKit instance ready');

    initialized = true;
    console.log('✅ WalletKit Bridge initialized successfully');

    // Bridge API that Swift will call
    // Main WalletKit logic lives here in JavaScript
    window.walletKit = {
        // Check if initialized
        isReady() {
            return initialized && walletKit;
        },

        setEventsListeners(callback) {
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

        removeEventListeners() {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🗑️ Bridge: Removing all event listeners');

            walletKit.removeConnectRequestCallback();
            walletKit.removeTransactionRequestCallback();
            walletKit.removeSignDataRequestCallback();
            walletKit.removeDisconnectCallback();

            console.log('🗑️ All event listeners removed');
        },

        async createV4R2WalletUsingMnemonic(mnemonic, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V4R2 wallet using mnemonic');

            if (!mnemonic) {
                throw new Error('Mnemonic required for mnemonic wallet type');
            }

            // Use Signer.fromMnemonic to create signer with publicKey
            const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

            // Create adapter with the appropriate version
            return await WalletV4R2Adapter.create(signer, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        async createV4R2WalletUsingSecretKey(secretKey, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V4R2 wallet using secret key');

            if (!secretKey) {
                throw new Error('Secret key required for secret key wallet type');
            }

            // Use Signer.fromMnemonic to create signer with publicKey
            const signer = await Signer.fromPrivateKey(secretKey);

            // Create adapter with the appropriate version
            return await WalletV4R2Adapter.create(signer, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        async createV4R2WalletUsingSigner(signer, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V4R2 wallet');

            if (!signer) {
                throw new Error('Signer required for wallet creation');
            }

            const customSigner: WalletSigner = {
                sign: async (bytes: Iterable<number>) => {
                    return await signer.sign(bytes);
                },
                publicKey: signer.publicKey(),
            };

            // Create adapter with the appropriate version
            return await WalletV4R2Adapter.create(customSigner, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        async processInjectedBridgeRequest(
            messageInfo: BridgeEventMessageInfo,
            request: InjectedToExtensionBridgeRequestPayload,
        ): Promise<unknown> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            return walletKit.processInjectedBridgeRequest(messageInfo, request);
        },

        async createV5R1WalletUsingMnemonic(mnemonic, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V5R1 wallet using mnemonic');

            if (!mnemonic) {
                throw new Error('Mnemonic required for mnemonic wallet type');
            }

            // Use Signer.fromMnemonic to create signer with publicKey
            const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

            // Create adapter with the appropriate version
            return await WalletV5R1Adapter.create(signer, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        async createV5R1WalletUsingSecretKey(secretKey, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V5R1 wallet using secret key');

            if (!secretKey) {
                throw new Error('Secret key required for secret key wallet type');
            }

            // Use Signer.fromMnemonic to create signer with publicKey
            const signer = await Signer.fromPrivateKey(secretKey);

            // Create adapter with the appropriate version
            return await WalletV5R1Adapter.create(signer, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        async createV5R1WalletUsingSigner(signer, parameters) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating V5R1 wallet');

            if (!signer) {
                throw new Error('Signer required for wallet creation');
            }

            const customSigner: WalletSigner = {
                sign: async (bytes: Iterable<number>) => {
                    return await signer.sign(bytes);
                },
                publicKey: signer.publicKey(),
            };

            // Create adapter with the appropriate version
            return await WalletV5R1Adapter.create(customSigner, {
                client: walletKit.getApiClient(),
                network: parameters.network,
            });
        },

        // Wallet management
        async addWallet(walletAdapter) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('➕ Bridge: Adding wallet:');

            const wallet = await walletKit.addWallet(walletAdapter);
            if (wallet) {
                console.log('✅ Wallet added:', wallet.getAddress());
            } else {
                console.log('✅ Wallet added: undefined');
            }
            return wallet;
        },

        async removeWallet(address) {
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

        async clearWallets() {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🗑️ Bridge: Clearing all wallets');

            try {
                const result = await walletKit.clearWallets();
                console.log('✅ All wallets cleared:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to clear wallets:', error);
                throw error;
            }
        },

        getWallets() {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('📋 Bridge: Getting wallets');

            return walletKit.getWallets();
        },

        async getSessions() {
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
        async handleTonConnectUrl(url) {
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

        async approveConnectRequest(request) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving connect request:', request, request.walletAddress);

            try {
                const result = await walletKit.approveConnectRequest(request);
                console.log('✅ Connect request approved for wallet:', request.walletAddress, result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve connect request:', error);
                throw error;
            }
        },

        async rejectConnectRequest(request, reason) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting connect request:', request.id, reason || 'User rejected');

            try {
                const result = await walletKit.rejectConnectRequest(request, reason);
                console.log('✅ Connect request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject connect request:', error);
                throw error;
            }
        },

        // Transaction handling
        async approveTransactionRequest(request) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving transaction request:', request);

            try {
                const result = await walletKit.approveTransactionRequest(request);
                console.log('✅ Transaction request approved:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve transaction request:', error);
                throw error;
            }
        },

        async rejectTransactionRequest(request, reason) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting transaction request:', request, reason);

            try {
                const result = await walletKit.rejectTransactionRequest(request, reason);
                console.log('✅ Transaction request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject transaction request:', error);
                throw error;
            }
        },

        // Sign data handling
        async approveSignDataRequest(request) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('✅ Bridge: Approving sign data request:', request);

            try {
                const result = await walletKit.signDataRequest(request);
                console.log('✅ Sign data request approved:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to approve sign data request:', error);
                throw error;
            }
        },

        async rejectSignDataRequest(request, reason) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('❌ Bridge: Rejecting sign data request:', request, reason);

            try {
                const result = await walletKit.rejectSignDataRequest(request, reason);
                console.log('✅ Sign data request rejected:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to reject sign data request:', error);
                throw error;
            }
        },

        // Session management
        async disconnect(sessionId) {
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

        // Jettons
        async getJettons(walletAddress) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🪙 Bridge: Getting jettons for:', walletAddress);

            try {
                const jettons = await walletKit.jettons.getAddressJettons(walletAddress);
                console.log('✅ Got jettons for', walletAddress, ':', jettons);
                return jettons;
            } catch (error) {
                console.error('❌ Failed to get jettons:', error);
                throw error;
            }
        },

        async sendTransaction(wallet, transaction) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('🪙 Bridge: Sending transaction:', transaction);

            await walletKit.handleNewTransaction(wallet, transaction);
        },
    };
};
