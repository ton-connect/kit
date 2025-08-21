import { TonWalletKit, WalletInitConfigMnemonic, type WalletInterface, type EventConnectRequest } from '@ton/walletkit';

import { SimpleEncryption } from '../../utils';
import type { Transaction } from '../../types/wallet';
import type { SetState, WalletSliceCreator } from '../../types/store';

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
            set({
                wallet: {
                    ...state.wallet,
                    hasWallet: true,
                    isAuthenticated: true,
                    address,
                    publicKey,
                    balance: balance.toString(),
                    encryptedMnemonic,
                    mnemonic: undefined, // Never store in memory
                    currentWallet: wallet,
                },
            });
        } catch (error) {
            console.error('Error creating wallet:', error);
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
                set({ wallet: { ...state.wallet, hasWallet: false, isAuthenticated: false } });
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
            set({
                wallet: {
                    ...state.wallet,
                    hasWallet: true,
                    isAuthenticated: true,
                    address,
                    publicKey,
                    balance: balance.toString(),
                    currentWallet: wallet,
                },
            });
        } catch (error) {
            console.error('Error loading wallet:', error);
            set({ wallet: { ...state.wallet, hasWallet: false, isAuthenticated: false } });
        }
    },

    getDecryptedMnemonic: async (): Promise<string[] | null> => {
        const state = get();

        // Debug: Check if we have current password
        if (!state.auth.currentPassword) {
            console.error('No current password available');
            return null;
        }

        try {
            // Debug: Check if we have encrypted data in state
            if (!state.wallet.encryptedMnemonic) {
                console.error('No encrypted mnemonic found in state');
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
                console.error('Decrypted mnemonic is empty');
                return null;
            }

            return mnemonic;
        } catch (error) {
            console.error('Error decrypting mnemonic:', error);
            return null;
        }
    },

    clearWallet: () => {
        const state = get();
        set({
            wallet: {
                ...state.wallet,
                isAuthenticated: false,
                hasWallet: false,
                address: undefined,
                balance: undefined,
                mnemonic: undefined,
                publicKey: undefined,
                transactions: [],
                currentWallet: undefined,
                encryptedMnemonic: undefined,
            },
        });
    },

    updateBalance: async () => {
        const state = get();
        if (!state.wallet.currentWallet) {
            console.warn('No wallet available to update balance');
            return;
        }

        try {
            // Get fresh balance from blockchain
            const balance = await state.wallet.currentWallet.getBalance();
            const balanceString = balance.toString();

            // Update state - persistence layer will handle storage
            set({
                wallet: {
                    ...state.wallet,
                    balance: balanceString,
                },
            });
        } catch (error) {
            console.error('Error updating balance:', error);
            throw new Error('Failed to update balance');
        }
    },

    addTransaction: (transaction: Transaction) => {
        const state = get();
        set({
            wallet: {
                ...state.wallet,
                transactions: [transaction, ...state.wallet.transactions],
            },
        });
    },

    // TON Connect URL handling
    handleTonConnectUrl: async (url: string) => {
        try {
            console.log('Handling TON Connect URL:', url);
            await walletKit.handleTonConnectUrl(url);
        } catch (error) {
            console.error('Failed to handle TON Connect URL:', error);
            throw new Error('Failed to process TON Connect link');
        }
    },

    // Connect request handling
    showConnectRequest: (request: EventConnectRequest) => {
        const state = get();
        set({
            wallet: {
                ...state.wallet,
                pendingConnectRequest: request,
                isConnectModalOpen: true,
            },
        });
    },

    approveConnectRequest: async (selectedWallet: WalletInterface) => {
        const state = get();
        if (!state.wallet.pendingConnectRequest) {
            console.error('No pending connect request to approve');
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
            set({
                wallet: {
                    ...state.wallet,
                    pendingConnectRequest: undefined,
                    isConnectModalOpen: false,
                },
            });
        } catch (error) {
            console.error('Failed to approve connect request:', error);
            throw error;
        }
    },

    rejectConnectRequest: async (reason?: string) => {
        const state = get();
        if (!state.wallet.pendingConnectRequest) {
            console.error('No pending connect request to reject');
            return;
        }

        try {
            await walletKit.rejectConnectRequest(state.wallet.pendingConnectRequest, reason);

            // Close the modal and clear pending request
            set({
                wallet: {
                    ...state.wallet,
                    pendingConnectRequest: undefined,
                    isConnectModalOpen: false,
                },
            });
        } catch (error) {
            console.error('Failed to reject connect request:', error);
            throw error;
        }
    },

    closeConnectModal: () => {
        const state = get();
        set({
            wallet: {
                ...state.wallet,
                isConnectModalOpen: false,
                pendingConnectRequest: undefined,
            },
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
        console.log('Connect request received:', event);
        showConnectRequest(event);
    });
};

// Export walletKit for external access if needed
export { walletKit };
