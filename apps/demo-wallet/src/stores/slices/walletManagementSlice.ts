/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type IWallet, type ITonWalletKit, CHAIN } from '@ton/walletkit';
import { createLedgerPath } from '@ton/v4ledger-adapter';

import { SimpleEncryption } from '../../utils';
import { createComponentLogger } from '../../utils/logger';
import { createWalletAdapter, generateWalletId, generateWalletName } from '../../utils/walletAdapterFactory';
import type { LedgerConfig, SavedWallet } from '../../types/wallet';
import type { SetState, WalletManagementSliceCreator } from '../../types/store';

const log = createComponentLogger('WalletManagementSlice');

export const createWalletManagementSlice: WalletManagementSliceCreator = (set: SetState, get) => ({
    walletManagement: {
        savedWallets: [],
        activeWalletId: undefined,
        address: undefined,
        balance: undefined,
        publicKey: undefined,
        events: [],
        hasNextEvents: false,
        currentWallet: undefined,
        hasWallet: false,
        isAuthenticated: false,
    },

    // Load all saved wallets into WalletKit
    loadSavedWalletsIntoKit: async (walletKit: ITonWalletKit) => {
        const state = get();
        if (!state.auth.currentPassword) {
            log.warn('Cannot load wallets: user not authenticated');
            return;
        }

        const savedWallets = state.walletManagement.savedWallets;
        if (savedWallets.length === 0) {
            log.info('No saved wallets to load');
            return;
        }

        log.info(`Loading ${savedWallets.length} saved wallets into WalletKit`);

        for (const savedWallet of savedWallets) {
            try {
                // Check if wallet already loaded using kitWalletId
                if (savedWallet.kitWalletId && walletKit.getWallet(savedWallet.kitWalletId)) {
                    log.info(`Wallet ${savedWallet.name} already loaded`);
                    continue;
                }

                let walletAdapter;
                const walletNetwork = savedWallet.network || 'testnet';

                if (savedWallet.walletType === 'ledger' && savedWallet.ledgerConfig) {
                    walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network: walletNetwork,
                        walletKit,
                        version: savedWallet.version || 'v4r2',
                    });
                } else if (savedWallet.encryptedMnemonic) {
                    const mnemonicJson = await SimpleEncryption.decrypt(
                        savedWallet.encryptedMnemonic,
                        state.auth.currentPassword,
                    );
                    const mnemonic = JSON.parse(mnemonicJson) as string[];

                    walletAdapter = await createWalletAdapter({
                        mnemonic,
                        useWalletInterfaceType: savedWallet.walletInterfaceType,
                        ledgerAccountNumber: state.auth.ledgerAccountNumber,
                        storedLedgerConfig: undefined,
                        network: walletNetwork,
                        walletKit,
                        version: savedWallet.version || 'v5r1',
                    });
                } else {
                    log.warn(`Skipping wallet ${savedWallet.id}: no mnemonic or ledger config`);
                    continue;
                }

                await walletKit.addWallet(walletAdapter);
                log.info(`Loaded wallet ${savedWallet.name} (${savedWallet.address})`);
            } catch (error) {
                log.error(`Failed to load wallet ${savedWallet.name}:`, error);
            }
        }
    },

    // Create a new wallet
    createWallet: async (
        mnemonic: string[],
        name?: string,
        version?: 'v5r1' | 'v4r2',
        network?: 'mainnet' | 'testnet',
    ) => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const walletId = generateWalletId();
            const walletName =
                name ||
                generateWalletName(
                    state.walletManagement.savedWallets,
                    state.auth.useWalletInterfaceType || 'mnemonic',
                );

            const encryptedMnemonic = await SimpleEncryption.encrypt(
                JSON.stringify(mnemonic),
                state.auth.currentPassword,
            );

            const walletVersion = version || 'v5r1';

            const walletNetwork = network || 'testnet';
            const walletAdapter = await createWalletAdapter({
                mnemonic,
                useWalletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                storedLedgerConfig: undefined,
                network: walletNetwork,
                walletKit: state.walletCore.walletKit,
                version: walletVersion,
            });

            const wallet = await state.walletCore.walletKit.addWallet(walletAdapter);
            if (!wallet) {
                throw new Error('Failed to find created wallet');
            }

            const address = wallet.getAddress();
            const publicKey = wallet.getPublicKey();

            const savedWallet: SavedWallet = {
                id: walletId,
                name: walletName,
                address,
                publicKey,
                encryptedMnemonic,
                walletType: state.auth.useWalletInterfaceType || 'mnemonic',
                walletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
                version: walletVersion,
                network: walletNetwork,
                createdAt: Date.now(),
                kitWalletId: wallet.getWalletId(),
            };

            set((state) => {
                state.walletManagement.savedWallets.push(savedWallet);
                state.walletManagement.hasWallet = true;
                state.walletManagement.isAuthenticated = true;
                state.walletManagement.activeWalletId = walletId;
                state.walletManagement.address = address;
                state.walletManagement.publicKey = publicKey;
                state.walletManagement.balance = '0';
                state.walletManagement.currentWallet = wallet;
            });

            log.info(`Created wallet ${walletId} (${walletName})`);
            return walletId;
        } catch (error) {
            log.error('Error creating wallet:', error);
            throw error instanceof Error ? error : new Error('Failed to create wallet');
        }
    },

    importWallet: async (
        mnemonic: string[],
        name?: string,
        version?: 'v5r1' | 'v4r2',
        network?: 'mainnet' | 'testnet',
    ) => {
        return get().createWallet(mnemonic, name, version, network);
    },

    createLedgerWallet: async (name?: string) => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (state.auth.useWalletInterfaceType !== 'ledger') {
            throw new Error('Wallet type must be set to ledger');
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const walletId = generateWalletId();
            const walletName = name || generateWalletName(state.walletManagement.savedWallets, 'ledger');
            const version = 'v4r2';

            const walletAdapter = await createWalletAdapter({
                useWalletInterfaceType: 'ledger',
                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                storedLedgerConfig: undefined,
                network: 'mainnet',
                walletKit: state.walletCore.walletKit,
                version: version,
            });

            const wallet = await state.walletCore.walletKit.addWallet(walletAdapter);

            if (!wallet) {
                throw new Error('Failed to find created Ledger wallet');
            }

            const address = wallet.getAddress();

            const existingWallet = state.walletManagement.savedWallets.find((w) => w.address === address);
            if (existingWallet) {
                log.warn(`Wallet with address ${address} already exists`);
                throw new Error('A wallet with this address already exists');
            }

            const balance = await wallet.getBalance();
            const publicKey = wallet.getPublicKey();

            const ledgerPath = createLedgerPath(false, 0, state.auth.ledgerAccountNumber || 0);
            const ledgerConfig: LedgerConfig = {
                publicKey: publicKey,
                path: ledgerPath,
                walletId: 698983191,
                version: version,
                network: 'mainnet',
                workchain: 0,
                accountIndex: state.auth.ledgerAccountNumber || 0,
            };

            const savedWallet: SavedWallet = {
                id: walletId,
                name: walletName,
                address,
                publicKey,
                ledgerConfig,
                walletType: 'ledger',
                walletInterfaceType: 'ledger',
                version: version,
                network: 'mainnet',
                createdAt: Date.now(),
                kitWalletId: wallet.getWalletId(),
            };

            set((state) => {
                state.walletManagement.savedWallets.push(savedWallet);
                state.walletManagement.hasWallet = true;
                state.walletManagement.isAuthenticated = true;
                state.walletManagement.activeWalletId = walletId;
                state.walletManagement.address = address;
                state.walletManagement.publicKey = publicKey;
                state.walletManagement.balance = balance.toString();
                state.walletManagement.currentWallet = wallet;
            });

            log.info(`Created Ledger wallet ${walletId} (${walletName})`);
            return walletId;
        } catch (error) {
            log.error('Error creating Ledger wallet:', error);
            throw error instanceof Error ? error : new Error('Failed to create Ledger wallet');
        }
    },

    switchWallet: async (walletId: string) => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        const savedWallet = state.walletManagement.savedWallets.find((w) => w.id === walletId);
        if (!savedWallet) {
            throw new Error('Wallet not found');
        }

        try {
            log.info(`Switching to wallet ${walletId} (${savedWallet.name})`);

            let wallet = savedWallet.kitWalletId
                ? state.walletCore.walletKit.getWallet(savedWallet.kitWalletId)
                : undefined;

            if (!wallet) {
                const walletNetwork = savedWallet.network || 'testnet';

                if (savedWallet.walletType === 'ledger') {
                    const walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig?.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network: walletNetwork,
                        walletKit: state.walletCore.walletKit,
                        version: savedWallet.version || 'v4r2',
                    });

                    await state.walletCore.walletKit.addWallet(walletAdapter);
                } else if (savedWallet.encryptedMnemonic) {
                    const decryptedString = await SimpleEncryption.decrypt(
                        savedWallet.encryptedMnemonic,
                        state.auth.currentPassword,
                    );
                    const mnemonic = JSON.parse(decryptedString) as string[];

                    const walletAdapter = await createWalletAdapter({
                        mnemonic,
                        useWalletInterfaceType: savedWallet.walletInterfaceType,
                        ledgerAccountNumber: state.auth.ledgerAccountNumber,
                        storedLedgerConfig: undefined,
                        network: walletNetwork,
                        walletKit: state.walletCore.walletKit,
                        version: savedWallet.version || 'v5r1',
                    });

                    await state.walletCore.walletKit.addWallet(walletAdapter);
                }
            }

            if (!wallet) {
                throw new Error('Failed to load wallet');
            }

            const balance = await wallet.getBalance();

            set((state) => {
                state.walletManagement.activeWalletId = walletId;
                state.walletManagement.address = savedWallet.address;
                state.walletManagement.publicKey = savedWallet.publicKey;
                state.walletManagement.balance = balance.toString();
                state.walletManagement.currentWallet = wallet;
                state.walletManagement.events = [];
            });

            await get().loadEvents();

            log.info(`Switched to wallet ${walletId} successfully`);
        } catch (error) {
            log.error('Error switching wallet:', error);
            throw new Error('Failed to switch wallet');
        }
    },

    removeWallet: (walletId: string) => {
        const state = get();
        const walletIndex = state.walletManagement.savedWallets.findIndex((w) => w.id === walletId);

        if (walletIndex === -1) {
            throw new Error('Wallet not found');
        }

        set((state) => {
            state.walletManagement.savedWallets.splice(walletIndex, 1);

            if (state.walletManagement.activeWalletId === walletId) {
                if (state.walletManagement.savedWallets.length > 0) {
                    const newActiveId = state.walletManagement.savedWallets[0].id;
                    state.walletManagement.activeWalletId = newActiveId;
                } else {
                    state.walletManagement.hasWallet = false;
                    state.walletManagement.isAuthenticated = false;
                    state.walletManagement.activeWalletId = undefined;
                    state.walletManagement.address = undefined;
                    state.walletManagement.publicKey = undefined;
                    state.walletManagement.balance = undefined;
                    state.walletManagement.currentWallet = undefined;
                    state.walletManagement.events = [];
                }
            }
        });

        log.info(`Removed wallet ${walletId}`);

        const newState = get();
        if (newState.walletManagement.activeWalletId && newState.walletManagement.activeWalletId !== walletId) {
            get().switchWallet(newState.walletManagement.activeWalletId);
        }
    },

    renameWallet: (walletId: string, newName: string) => {
        set((state) => {
            const wallet = state.walletManagement.savedWallets.find((w) => w.id === walletId);
            if (wallet) {
                wallet.name = newName;
            }
        });
        log.info(`Renamed wallet ${walletId} to ${newName}`);
    },

    loadAllWallets: async () => {
        let state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (!state.walletCore.walletKit) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        state = get();
        if (state.walletCore.walletKitInitializer) {
            await state.walletCore.walletKitInitializer;
        }

        state = get();

        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }
        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info(`Loading ${state.walletManagement.savedWallets.length} saved wallets`);

            for (const savedWallet of state.walletManagement.savedWallets) {
                // Check if wallet already loaded using kitWalletId or address fallback
                const existingWallet = savedWallet.kitWalletId
                    ? state.walletCore.walletKit.getWallet(savedWallet.kitWalletId)
                    : undefined;

                if (existingWallet) {
                    log.info(`Wallet ${savedWallet.id} already loaded`);
                    continue;
                }

                const walletNetwork = savedWallet.network || 'testnet';

                if (savedWallet.walletType === 'ledger') {
                    const walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig?.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network: walletNetwork,
                        walletKit: state.walletCore.walletKit,
                        version: savedWallet.version || 'v4r2',
                    });

                    await state.walletCore.walletKit.addWallet(walletAdapter);
                } else if (savedWallet.encryptedMnemonic) {
                    const decryptedString = await SimpleEncryption.decrypt(
                        savedWallet.encryptedMnemonic,
                        state.auth.currentPassword,
                    );
                    const mnemonic = JSON.parse(decryptedString) as string[];

                    const walletAdapter = await createWalletAdapter({
                        mnemonic,
                        useWalletInterfaceType: savedWallet.walletInterfaceType,
                        ledgerAccountNumber: state.auth.ledgerAccountNumber,
                        storedLedgerConfig: undefined,
                        network: walletNetwork,
                        walletKit: state.walletCore.walletKit,
                        version: savedWallet.version || 'v5r1',
                    });

                    await state.walletCore.walletKit.addWallet(walletAdapter);
                }
            }

            if (state.walletManagement.savedWallets.length > 0 && !state.walletManagement.activeWalletId) {
                await get().switchWallet(state.walletManagement.savedWallets[0].id);
            } else if (state.walletManagement.activeWalletId) {
                await get().switchWallet(state.walletManagement.activeWalletId);
            }

            set((state) => {
                state.walletManagement.hasWallet = state.walletManagement.savedWallets.length > 0;
                state.walletManagement.isAuthenticated = state.walletManagement.savedWallets.length > 0;
            });

            log.info('All wallets loaded successfully');
        } catch (error) {
            log.error('Error loading wallets:', error);
            throw new Error('Failed to load wallets');
        }
    },

    getDecryptedMnemonic: async (walletId?: string): Promise<string[] | null> => {
        const state = get();

        if (!state.auth.currentPassword) {
            log.error('No current password available');
            return null;
        }

        try {
            const targetWalletId = walletId || state.walletManagement.activeWalletId;
            if (!targetWalletId) {
                log.error('No wallet ID provided or active');
                return null;
            }

            const savedWallet = state.walletManagement.savedWallets.find((w) => w.id === targetWalletId);
            if (!savedWallet || !savedWallet.encryptedMnemonic) {
                log.error('No encrypted mnemonic found for wallet');
                return null;
            }

            const decryptedString = await SimpleEncryption.decrypt(
                savedWallet.encryptedMnemonic,
                state.auth.currentPassword,
            );

            const mnemonic = JSON.parse(decryptedString) as string[];

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
            state.walletManagement.isAuthenticated = false;
            state.walletManagement.hasWallet = false;
            state.walletManagement.savedWallets = [];
            state.walletManagement.activeWalletId = undefined;
            state.walletManagement.address = undefined;
            state.walletManagement.balance = undefined;
            state.walletManagement.publicKey = undefined;
            state.walletManagement.events = [];
            state.walletManagement.currentWallet = undefined;
            state.tonConnect.pendingConnectRequest = undefined;
            state.tonConnect.isConnectModalOpen = false;
            state.tonConnect.pendingTransactionRequest = undefined;
            state.tonConnect.isTransactionModalOpen = false;
            state.tonConnect.pendingSignDataRequest = undefined;
            state.tonConnect.isSignDataModalOpen = false;
        });
    },

    updateBalance: async () => {
        const state = get();
        if (!state.walletManagement.currentWallet) {
            log.warn('No wallet available to update balance');
            return;
        }

        try {
            const balance = await state.walletManagement.currentWallet.getBalance();
            const balanceString = balance.toString();

            set((state) => {
                state.walletManagement.balance = balanceString;
            });
        } catch (error) {
            log.error('Error updating balance:', error);
            throw new Error('Failed to update balance');
        }
    },

    loadEvents: async (limit = 10, offset = 0) => {
        const state = get();
        if (!state.walletManagement.address) {
            log.warn('No wallet address available to load events');
            return;
        }

        if (!state.walletCore.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info('Loading events for address:', state.walletManagement.address, 'limit:', limit, 'offset:', offset);

            const activeWallet = state.walletManagement.savedWallets.find(
                (w) => w.id === state.walletManagement.activeWalletId,
            );
            const walletNetwork = activeWallet?.network || 'testnet';

            const response = await state.walletCore.walletKit
                .getApiClient(walletNetwork === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET)
                .getEvents({
                    account: state.walletManagement.address,
                    limit,
                    offset,
                });

            set((state) => {
                state.walletManagement.events = response.events;
                state.walletManagement.hasNextEvents = response.hasNext;
            });

            log.info(`Loaded ${response.events.length} events`);
        } catch (error) {
            log.error('Error loading events:', error);
            throw new Error('Failed to load events');
        }
    },

    getAvailableWallets: (): IWallet[] => {
        const state = get();
        if (!state.walletCore.walletKit) {
            return [];
        }
        return state.walletCore.walletKit.getWallets();
    },

    getActiveWallet: (): SavedWallet | undefined => {
        const state = get();
        if (!state.walletManagement.activeWalletId) {
            return undefined;
        }
        return state.walletManagement.savedWallets.find((w) => w.id === state.walletManagement.activeWalletId);
    },
});
