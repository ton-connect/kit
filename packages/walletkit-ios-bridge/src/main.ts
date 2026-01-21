/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WalletSigner, BridgeEventMessageInfo, InjectedToExtensionBridgeRequestPayload } from '@ton/walletkit';
import { MemoryStorageAdapter, Signer, WalletV4R2Adapter, WalletV5R1Adapter, TonWalletKit } from '@ton/walletkit';
import type { WalletAdapter } from '@ton/walletkit';

import { SwiftStorageAdapter } from './SwiftStorageAdapter';
import { SwiftWalletAdapter } from './SwiftWalletAdapter';

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

    const networks = {};
    if (configuration.networkConfigurations) {
        for (const netConfig of configuration.networkConfigurations) {
            networks[netConfig.network.chainId] = {
                apiClient: netConfig.apiClient,
            };
        }
    }

    const walletKit = new TonWalletKit({
        networks,
        walletManifest: configuration.walletManifest,
        deviceInfo: configuration.deviceInfo,
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
        isReady() {
            return initialized && walletKit;
        },

        jettonsManager() {
            return walletKit.jettons;
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

        async createSignerFromMnemonic(mnemonic) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating signer from mnemonic');

            if (!mnemonic) {
                throw new Error('Mnemonic is required to create signer');
            }

            return await Signer.fromMnemonic(mnemonic, { type: 'ton' });
        },

        async createSignerFromPrivateKey(privateKey) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('➕ Bridge: Creating signer from private key');

            if (!privateKey) {
                throw new Error('Private key is required to create signer');
            }

            return await Signer.fromPrivateKey(privateKey);
        },

        async createV4R2WalletAdapter(signer, parameters) {
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

        async createV5R1WalletAdapter(signer, parameters) {
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

        jsSigner(signer): WalletSigner {
            if (isSwiftObject(signer)) {
                return {
                    sign: async (bytes: Iterable<number>) => {
                        return await signer.sign(bytes);
                    },
                    publicKey: signer.publicKey(),
                };
            }
            return signer;
        },

        async processInjectedBridgeRequest(
            messageInfo: BridgeEventMessageInfo,
            request: InjectedToExtensionBridgeRequestPayload,
        ): Promise<unknown> {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            return walletKit.processInjectedBridgeRequest(messageInfo, request);
        },

        // Wallet management
        async addWallet(walletAdapter) {
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

        jsWalletAdapter(walletAdapter): WalletAdapter {
            if (isSwiftObject(walletAdapter)) {
                return new SwiftWalletAdapter(walletAdapter, walletKit.getApiClient(walletAdapter.getNetwork()));
            }
            return walletAdapter;
        },

        getWallet(address) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');

            console.log('🔍 Bridge: Getting wallet for address:', address);
            return walletKit.getWallet(address);
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
                const result = await walletKit.approveSignDataRequest(request);
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

function parseSwiftConstructorPattern(str) {
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

function isSwiftObject(obj) {
    if (obj && obj.constructor) {
        const pattern = parseSwiftConstructorPattern(obj.constructor.toString());
        return pattern !== null;
    }
    return false;
}
