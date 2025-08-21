import { TonWalletKit, WalletInitConfigMnemonic, type WalletInterface, type EventConnectRequest } from '@ton/walletkit';

import { SimpleEncryption } from '../../utils';
import { createComponentLogger } from '../../utils/logger';
import type { Transaction } from '../../types/wallet';
import type { SetState, WalletSliceCreator } from '../../types/store';

// Create logger for wallet slice
const log = createComponentLogger('WalletSlice');

// Initialize WalletKit
const walletKit = new TonWalletKit({
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    network: 'mainnet',
    wallets: [],
});

export const createWalletSlice: WalletSliceCreator = (set: SetState, get) => ({
    wallet: {
        // Initial state
        isAuthenticated: false,
        hasWallet: false,
        address: undefined,
        balance: undefined,
        mnemonic: undefined,
        publicKey: undefined,
        transactions: [],
        currentWallet: undefined,
        pendingConnectRequest: undefined,
        isConnectModalOpen: false,
        encryptedMnemonic: undefined,
    },

    // Actions
    createWallet: async (mnemonic: string[]) => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        try {
            // Encrypt and store the mnemonic in state
            const encryptedMnemonic = await SimpleEncryption.encrypt(
                JSON.stringify(mnemonic),
                state.auth.currentPassword,
            );

            // Create wallet using walletkit
            const walletConfig = new WalletInitConfigMnemonic({
                mnemonic,
                version: 'v5r1',
                mnemonicType: 'ton',
                network: 'mainnet',
            });

            await walletKit.addWallet(walletConfig);
            const wallets = walletKit.getWallets();
            const wallet = wallets[0];

            // Get real wallet info
            const address = wallet.getAddress();
            const balance = await wallet.getBalance();
            const publicKey = Array.from(wallet.publicKey)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');

            // Update state - persistence layer will handle storage
            set((state) => {
                state.wallet.hasWallet = true;
                state.wallet.isAuthenticated = true;
                state.wallet.address = address;
                state.wallet.publicKey = publicKey;
                state.wallet.balance = balance.toString();
                state.wallet.encryptedMnemonic = encryptedMnemonic;
                state.wallet.mnemonic = undefined; // Never store in memory
                state.wallet.currentWallet = wallet;
            });
        } catch (error) {
            log.error('Error creating wallet:', error);
            throw new Error('Failed to create wallet');
        }
    },

    importWallet: async (mnemonic: string[]) => {
        // Same as create wallet - we encrypt and store the mnemonic
        return get().createWallet(mnemonic);
    },

    loadWallet: async () => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        try {
            // Check if we have an encrypted mnemonic in state
            if (!state.wallet.encryptedMnemonic) {
                set((state) => {
                    state.wallet.hasWallet = false;
                    state.wallet.isAuthenticated = false;
                });
                return;
            }

            // Decrypt the mnemonic and recreate wallet with walletkit
            const decryptedString = await SimpleEncryption.decrypt(
                state.wallet.encryptedMnemonic,
                state.auth.currentPassword,
            );
            const mnemonic = JSON.parse(decryptedString) as string[];

            // Create wallet using walletkit
            const walletConfig = new WalletInitConfigMnemonic({
                mnemonic,
                version: 'v5r1',
                mnemonicType: 'ton',
                network: 'mainnet',
            });

            await walletKit.addWallet(walletConfig);
            const wallets = walletKit.getWallets();
            const wallet = wallets[0];

            // Get real wallet info
            const address = wallet.getAddress();
            const balance = await wallet.getBalance();
            const publicKey = Array.from(wallet.publicKey)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');

            // Update state - persistence layer will handle storage
            set((state) => {
                state.wallet.hasWallet = true;
                state.wallet.isAuthenticated = true;
                state.wallet.address = address;
                state.wallet.publicKey = publicKey;
                state.wallet.balance = balance.toString();
                state.wallet.currentWallet = wallet;
            });
        } catch (error) {
            log.error('Error loading wallet:', error);
            set((state) => {
                state.wallet.hasWallet = false;
                state.wallet.isAuthenticated = false;
            });
        }
    },

    getDecryptedMnemonic: async (): Promise<string[] | null> => {
        const state = get();

        // Debug: Check if we have current password
        if (!state.auth.currentPassword) {
            log.error('No current password available');
            return null;
        }

        try {
            // Debug: Check if we have encrypted data in state
            if (!state.wallet.encryptedMnemonic) {
                log.error('No encrypted mnemonic found in state');
                return null;
            }

            // Debug: Attempt decryption
            const decryptedString = await SimpleEncryption.decrypt(
                state.wallet.encryptedMnemonic,
                state.auth.currentPassword,
            );

            const mnemonic = JSON.parse(decryptedString) as string[];

            // Debug: Check result
            if (!mnemonic || mnemonic.length === 0) {
                log.error('Decrypted mnemonic is empty');
                return null;
            }

            return mnemonic;
        } catch (error) {
            log.error('Error decrypting mnemonic:', error);
            return null;
        }
    },

    clearWallet: () => {
        set((state) => {
            state.wallet.isAuthenticated = false;
            state.wallet.hasWallet = false;
            state.wallet.address = undefined;
            state.wallet.balance = undefined;
            state.wallet.mnemonic = undefined;
            state.wallet.publicKey = undefined;
            state.wallet.transactions = [];
            state.wallet.currentWallet = undefined;
            state.wallet.encryptedMnemonic = undefined;
        });
    },

    updateBalance: async () => {
        const state = get();
        if (!state.wallet.currentWallet) {
            log.warn('No wallet available to update balance');
            return;
        }

        try {
            // Get fresh balance from blockchain
            const balance = await state.wallet.currentWallet.getBalance();
            const balanceString = balance.toString();

            // Update state - persistence layer will handle storage
            set((state) => {
                state.wallet.balance = balanceString;
            });
        } catch (error) {
            log.error('Error updating balance:', error);
            throw new Error('Failed to update balance');
        }
    },

    addTransaction: (transaction: Transaction) => {
        set((state) => {
            state.wallet.transactions = [transaction, ...state.wallet.transactions];
        });
    },

    // TON Connect URL handling
    handleTonConnectUrl: async (url: string) => {
        try {
            log.info('Handling TON Connect URL:', url);
            await walletKit.handleTonConnectUrl(url);
        } catch (error) {
            log.error('Failed to handle TON Connect URL:', error);
            throw new Error('Failed to process TON Connect link');
        }
    },

    // Connect request handling
    showConnectRequest: (request: EventConnectRequest) => {
        set((state) => {
            state.wallet.pendingConnectRequest = request;
            state.wallet.isConnectModalOpen = true;
        });
    },

    approveConnectRequest: async (selectedWallet: WalletInterface) => {
        const state = get();
        if (!state.wallet.pendingConnectRequest) {
            log.error('No pending connect request to approve');
            return;
        }

        try {
            // Set the wallet on the connect event as per user requirements
            const updatedRequest = {
                ...state.wallet.pendingConnectRequest,
                wallet: selectedWallet,
            };

            // Approve the connect request with the selected wallet
            await walletKit.approveConnectRequest(updatedRequest);

            // Close the modal and clear pending request
            set((state) => {
                state.wallet.pendingConnectRequest = undefined;
                state.wallet.isConnectModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to approve connect request:', error);
            throw error;
        }
    },

    rejectConnectRequest: async (reason?: string) => {
        const state = get();
        if (!state.wallet.pendingConnectRequest) {
            log.error('No pending connect request to reject');
            return;
        }

        try {
            await walletKit.rejectConnectRequest(state.wallet.pendingConnectRequest, reason);

            // Close the modal and clear pending request
            set((state) => {
                state.wallet.pendingConnectRequest = undefined;
                state.wallet.isConnectModalOpen = false;
            });
        } catch (error) {
            log.error('Failed to reject connect request:', error);
            throw error;
        }
    },

    closeConnectModal: () => {
        set((state) => {
            state.wallet.isConnectModalOpen = false;
            state.wallet.pendingConnectRequest = undefined;
        });
    },

    // Getters
    getAvailableWallets: () => {
        return walletKit.getWallets();
    },
});

// Set up connect request listener - this will be called from the appStore
export const setupWalletKitListeners = (showConnectRequest: (request: EventConnectRequest) => void) => {
    walletKit.onConnectRequest((event) => {
        log.info('Connect request received:', event);
        showConnectRequest(event);
    });
    walletKit.onTransactionRequest((event) => {
        log.info('Transaction request received:', event);

        // showTransactionRequest(event);
    });
};

// Export walletKit for external access if needed
export { walletKit };
