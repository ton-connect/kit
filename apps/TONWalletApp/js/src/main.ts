/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CHAIN, MemoryStorageAdapter, TonWalletKit } from '@ton/walletkit';

declare global {
    interface Window {
        walletKitSwiftBridge?: {
            config?: any;
            sendEvent: (eventType: string, data: any) => void;
            callNative: (method: string, args: any[]) => Promise<any>;
        };

        walletKit?: any;

        initWalletKit: () => Promise<void>;
    }
}

window.initWalletKit = async () => {
    console.log('🚀 WalletKit iOS Bridge starting...');

    console.log('Creating WalletKit instance');

    const walletKit = new TonWalletKit({
        network: CHAIN.MAINNET,
        walletManifest: {
            name: 'Wallet',
            appName: 'Wallet',
            imageUrl: 'https://example.com/image.png',
            bridgeUrl: 'https://example.com/bridge.png',
            universalLink: 'https://example.com/universal-link',
            aboutUrl: 'https://example.com/about',
            platforms: ['chrome', 'firefox', 'safari', 'android', 'ios', 'windows', 'macos', 'linux'],
            jsBridgeKey: 'wallet',
        },
        deviceInfo: {
            platform: 'browser',
            appName: 'Wallet',
            appVersion: '1.0.0',
            maxProtocolVersion: 2,
            features: [
                'SendTransaction',
                {
                    name: 'SendTransaction',
                    maxMessages: 1,
                },
                {
                    name: 'SignData',
                    types: ['text', 'binary', 'cell'],
                },
            ],
        },
        // apiUrl: 'https://tonapi.io',
        // config: {
        bridge: {
            bridgeUrl: 'https://bridge.tonapi.io/bridge',
        },
        eventProcessor: {
            // disableEvents: true,
        },
        // },

        apiClient: {
            key: '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d',
        },

        storage: new MemoryStorageAdapter({}),
    });

    console.log('🚀 WalletKit iOS Bridge starting...');

    // Bridge configuration will be injected by Swift
    let bridgeConfig = {
        network: 'testnet',
        storage: 'memory',
        manifestUrl: '',
        isMobile: true,
        isNative: true,
    };

    // Update config if provided by Swift bridge
    if (window.walletKitSwiftBridge?.config) {
        bridgeConfig = { ...bridgeConfig, ...window.walletKitSwiftBridge.config };
        console.log('📋 Using bridge config:', bridgeConfig);
    }

    let initialized = false;

    // Initialize the full WalletKit here in JavaScript
    // Swift will call the JavaScript APIs directly for wallet operations
    // Events from WalletKit will be forwarded to Swift via the bridge

    async function initializeWalletKit() {
        console.log('🔄 Initializing WalletKit Bridge with config:', bridgeConfig);

        // WalletKit is already constructed with config, just set up the bridge
        console.log('✅ WalletKit instance ready');

        // Set up event listeners for wallet events
        walletKit.onConnectRequest((event) => {
            console.log('📨 Connect request received:', event);
            if (window.walletKitSwiftBridge) {
                window.walletKitSwiftBridge.sendEvent('connectRequest', event);
            }
        });

        walletKit.onTransactionRequest((event) => {
            console.log('📨 Transaction request received:', event);
            if (window.walletKitSwiftBridge) {
                window.walletKitSwiftBridge.sendEvent('transactionRequest', event);
            }
        });

        walletKit.onSignDataRequest((event) => {
            console.log('📨 Sign data request received:', event);
            if (window.walletKitSwiftBridge) {
                window.walletKitSwiftBridge.sendEvent('signDataRequest', event);
            }
        });

        walletKit.onDisconnect((event) => {
            console.log('📨 Disconnect event received:', event);
            if (window.walletKitSwiftBridge) {
                window.walletKitSwiftBridge.sendEvent('disconnect', event);
            }
        });

        initialized = true;
        console.log('✅ WalletKit Bridge initialized successfully');
    }

    // Bridge API that Swift will call
    // Main WalletKit logic lives here in JavaScript
    window.walletKit = {
        // Check if initialized
        isReady() {
            return initialized && walletKit;
        },

        // Wallet management
        async addWallet(config) {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('➕ Bridge: Adding wallet:', config);

            try {
                console.log('addWallet', config);
                const result = await walletKit.addWallet(config);
                console.log('✅ Wallet added:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to add wallet:', error.toString());
                throw error;
            }
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

        async getWallets() {
            if (!initialized) throw new Error('WalletKit Bridge not initialized');
            console.log('📋 Bridge: Getting wallets');

            try {
                const wallets = await walletKit.getWallets();
                console.log(
                    '✅ Got wallets:',
                    JSON.stringify(wallets, (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
                );
                return wallets;
            } catch (error) {
                console.error('❌ Failed to get wallets:', error.toString());
                throw error;
            }
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
    };

    initializeWalletKit();
}