import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { TonClient } from '@ton/ton';
import { TonWalletKit, WalletInitConfigMnemonic, createWalletV5R1, type WalletInterface } from '@ton/walletkit';

import { storage, STORAGE_KEYS, SimpleEncryption } from '../utils';
import { useAuthStore } from './authStore';
import type { Transaction, WalletState } from '../types/wallet';

// Initialize TonClient and WalletKit
// const tonClient = new TonClient({
//     endpoint: 'https://toncenter.com/api/v2/jsonRPC',
// });

const walletKit = new TonWalletKit({
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    network: 'mainnet',
    wallets: [],
});

interface WalletStore extends WalletState {
    // Transaction history
    transactions: Transaction[];

    // Walletkit instance and current wallet
    currentWallet?: WalletInterface;

    // Actions
    createWallet: (mnemonic: string[]) => Promise<void>;
    importWallet: (mnemonic: string[]) => Promise<void>;
    loadWallet: () => Promise<void>;
    clearWallet: () => void;
    updateBalance: () => Promise<void>;
    addTransaction: (transaction: Transaction) => void;

    // Getters
    getDecryptedMnemonic: () => Promise<string[] | null>;
}

export const useWalletStore = create<WalletStore>()(
    persist(
        (set, get) => ({
            // Initial state
            isAuthenticated: false,
            hasWallet: false,
            transactions: [],
            currentWallet: undefined,

            // Actions
            createWallet: async (mnemonic: string[]) => {
                const authState = useAuthStore.getState();
                if (!authState.currentPassword) {
                    throw new Error('User not authenticated');
                }

                try {
                    // Encrypt and store the mnemonic
                    const encryptedMnemonic = await SimpleEncryption.encrypt(
                        JSON.stringify(mnemonic),
                        authState.currentPassword,
                    );

                    storage.set(STORAGE_KEYS.ENCRYPTED_MNEMONIC, encryptedMnemonic);

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

                    // const wallet = await createWalletV5R1(walletConfig, {
                    //     tonClient: tonClient,
                    // });

                    // Get real wallet info
                    const address = wallet.getAddress();
                    const balance = await wallet.getBalance();
                    const publicKey = Array.from(wallet.publicKey)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');

                    // Store wallet data
                    const walletData = {
                        address,
                        publicKey,
                        balance: balance.toString(),
                    };

                    storage.set(STORAGE_KEYS.WALLET_STATE, walletData);

                    set({
                        hasWallet: true,
                        isAuthenticated: true,
                        address,
                        publicKey,
                        balance: balance.toString(),
                        mnemonic: undefined, // Never store in memory
                        currentWallet: wallet,
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
                const authState = useAuthStore.getState();
                if (!authState.currentPassword) {
                    throw new Error('User not authenticated');
                }

                try {
                    // Check if we have an encrypted mnemonic
                    const encryptedMnemonic = storage.get<string>(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
                    if (!encryptedMnemonic) {
                        set({ hasWallet: false, isAuthenticated: false });
                        return;
                    }

                    // Decrypt the mnemonic and recreate wallet with walletkit
                    const decryptedString = await SimpleEncryption.decrypt(
                        encryptedMnemonic,
                        authState.currentPassword,
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

                    // const wallet = await createWalletV5R1(walletConfig, {
                    //     tonClient: tonClient,
                    // });

                    // Get real wallet info
                    const address = wallet.getAddress();
                    const balance = await wallet.getBalance();
                    const publicKey = Array.from(wallet.publicKey)
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');

                    // Update stored wallet data with real info
                    const walletData = {
                        address,
                        publicKey,
                        balance: balance.toString(),
                    };

                    storage.set(STORAGE_KEYS.WALLET_STATE, walletData);

                    set({
                        hasWallet: true,
                        isAuthenticated: true,
                        address,
                        publicKey,
                        balance: balance.toString(),
                        currentWallet: wallet,
                    });
                } catch (error) {
                    console.error('Error loading wallet:', error);
                    set({ hasWallet: false, isAuthenticated: false });
                }
            },

            getDecryptedMnemonic: async (): Promise<string[] | null> => {
                const authState = useAuthStore.getState();

                // Debug: Check if we have current password
                if (!authState.currentPassword) {
                    console.error('No current password available');
                    return null;
                }

                try {
                    const encryptedMnemonic = storage.get<string>(STORAGE_KEYS.ENCRYPTED_MNEMONIC);

                    // Debug: Check if we have encrypted data
                    if (!encryptedMnemonic) {
                        console.error('No encrypted mnemonic found in storage');
                        return null;
                    }

                    // Debug: Attempt decryption
                    const decryptedString = await SimpleEncryption.decrypt(
                        encryptedMnemonic,
                        authState.currentPassword,
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
                storage.remove(STORAGE_KEYS.ENCRYPTED_MNEMONIC);
                storage.remove(STORAGE_KEYS.WALLET_STATE);
                storage.remove(STORAGE_KEYS.TRANSACTIONS);

                set({
                    isAuthenticated: false,
                    hasWallet: false,
                    address: undefined,
                    balance: undefined,
                    mnemonic: undefined,
                    publicKey: undefined,
                    transactions: [],
                    currentWallet: undefined,
                });
            },

            updateBalance: async () => {
                const state = get();
                if (!state.currentWallet) {
                    console.warn('No wallet available to update balance');
                    return;
                }

                try {
                    // Get fresh balance from blockchain
                    const balance = await state.currentWallet.getBalance();
                    const balanceString = balance.toString();

                    set({ balance: balanceString });

                    // Update stored wallet data
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const walletData = storage.get<any>(STORAGE_KEYS.WALLET_STATE);
                    if (walletData) {
                        storage.set(STORAGE_KEYS.WALLET_STATE, {
                            ...walletData,
                            balance: balanceString,
                        });
                    }
                } catch (error) {
                    console.error('Error updating balance:', error);
                    throw new Error('Failed to update balance');
                }
            },

            addTransaction: (transaction: Transaction) => {
                set((state) => ({
                    transactions: [transaction, ...state.transactions],
                }));
            },
        }),
        {
            name: STORAGE_KEYS.WALLET_STATE + '_persist',
            partialize: (state) => ({
                hasWallet: state.hasWallet,
                isAuthenticated: false, // Never persist authentication
                transactions: state.transactions,
                // currentWallet is not persisted as it contains methods and client instances
            }),
        },
    ),
);
