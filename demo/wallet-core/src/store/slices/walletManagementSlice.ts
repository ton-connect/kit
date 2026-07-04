/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { compareAddress, Base64ToHex, Network } from '@ton/walletkit';
import type { ITonWalletKit, Transaction, TransactionsUpdate, Wallet, WalletAdapter } from '@ton/walletkit';
import { createLedgerPath } from '@demo/v4ledger-adapter';

import { SimpleEncryption } from '../../utils';
import { createComponentLogger } from '../../utils/logger';
import { getChainNetwork } from '../../utils/network';
import { createWalletAdapter, generateWalletId, generateWalletName } from '../../utils/walletAdapterFactory';
import type { LedgerConfig, SavedWallet, WalletKitConfig } from '../../types/wallet';
import type { NetworkType } from '../../utils/network';
import type { SetState, WalletManagementSliceCreator } from '../../types/store';

const log = createComponentLogger('WalletManagementSlice');

let activeStreamingUnwatchers: Array<() => void> = [];

/**
 * In-flight guard for loadEvents. The dashboard preview and the history page both mount
 * a use-transaction-rows effect, and streaming confirmations also trigger a reload — under
 * React StrictMode (dev) these fire concurrently and hammered toncenter with duplicate
 * /traces requests (intermittent "timeout: context deadline exceeded"). We coalesce calls
 * for the SAME (limit, offset) onto the first request's promise; a different window (e.g.
 * the history "Load more" fetching the next offset page) is chained after, never dropped.
 * Because dashboard and history now share the same first-page window (limit 25, offset 0),
 * they collapse to a single /traces request that serves both.
 */
let inFlightEventsLoad: { key: string; promise: Promise<void> } | null = null;

/** Toncenter returns this transient error under load; worth one quick retry. */
const isToncenterTimeout = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /timeout|context deadline exceeded/i.test(message);
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const createWalletManagementSlice =
    (walletKitConfig?: WalletKitConfig): WalletManagementSliceCreator =>
    (set: SetState, get) => ({
        walletManagement: {
            savedWallets: [],
            activeWalletId: undefined,
            address: undefined,
            balance: undefined,
            publicKey: undefined,
            events: [],
            hasNextEvents: false,
            isLoadingEvents: false,
            eventsLoaded: false,
            eventsError: false,
            accountStatus: undefined,
            pendingTransactions: [],
            confirmedTraceIds: [],
            confirmedExternalHashes: [],
            currentWallet: undefined,
            hasWallet: false,
            isAuthenticated: false,
            isStreamingConnected: false,
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

                    const walletAdapter = await state.createAdapterFromSavedWallet(walletKit, savedWallet);

                    if (!walletAdapter) {
                        log.warn(`Failed to create adapter for wallet ${savedWallet.name}`);
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
        createWallet: async (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2', network?: NetworkType) => {
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
                    // Leave balance undefined (shows skeleton) until the real balance loads,
                    // so the received-toast hook seeds the actual balance instead of diffing from 0.
                    state.walletManagement.balance = undefined;
                    state.walletManagement.currentWallet = wallet;
                });

                await get().startWebSocketStreaming();
                log.info(`Created wallet ${walletId} (${walletName})`);
                return walletId;
            } catch (error) {
                log.error('Error creating wallet:', error);
                throw error instanceof Error ? error : new Error('Failed to create wallet');
            }
        },

        importWallet: async (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2', network?: NetworkType) => {
            return get().createWallet(mnemonic, name, version, network);
        },

        createLedgerWallet: async (name?: string, network?: NetworkType) => {
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
                const getneratedWalletId = generateWalletId();
                const walletName = name || generateWalletName(state.walletManagement.savedWallets, 'ledger');
                const version = 'v4r2';
                const walletNetwork = network || 'mainnet';

                if (!walletKitConfig?.createLedgerTransport) {
                    throw new Error('createLedgerTransport is required for Ledger wallet');
                }

                const walletAdapter = await createWalletAdapter({
                    useWalletInterfaceType: 'ledger',
                    ledgerAccountNumber: state.auth.ledgerAccountNumber,
                    storedLedgerConfig: undefined,
                    network: walletNetwork,
                    walletKit: state.walletCore.walletKit,
                    version: version,
                    createLedgerTransport: walletKitConfig.createLedgerTransport,
                });

                const wallet = await state.walletCore.walletKit.addWallet(walletAdapter);

                if (!wallet) {
                    throw new Error('Failed to find created Ledger wallet');
                }

                const address = wallet.getAddress();
                const kitWalletId = wallet.getWalletId();

                const existingWallet = state.walletManagement.savedWallets.find((w) => w.kitWalletId === kitWalletId);
                if (existingWallet) {
                    log.warn(`Wallet with walletId ${kitWalletId} already exists`);
                    throw new Error('A wallet with this walletId already exists');
                }

                const balance = await wallet.getBalance();
                const publicKey = wallet.getPublicKey();

                const ledgerPath = createLedgerPath(
                    wallet.getNetwork().chainId === Network.testnet().chainId,
                    0,
                    state.auth.ledgerAccountNumber || 0,
                );
                const ledgerConfig: LedgerConfig = {
                    publicKey: publicKey,
                    path: ledgerPath,
                    walletId: 698983191,
                    version: version,
                    network: walletNetwork,
                    workchain: 0,
                    accountIndex: state.auth.ledgerAccountNumber || 0,
                };

                const savedWallet: SavedWallet = {
                    id: getneratedWalletId,
                    name: walletName,
                    address,
                    publicKey,
                    ledgerConfig,
                    walletType: 'ledger',
                    walletInterfaceType: 'ledger',
                    version: version,
                    network: walletNetwork,
                    createdAt: Date.now(),
                    kitWalletId: wallet.getWalletId(),
                };

                set((state) => {
                    state.walletManagement.savedWallets.push(savedWallet);
                    state.walletManagement.hasWallet = true;
                    state.walletManagement.isAuthenticated = true;
                    state.walletManagement.activeWalletId = getneratedWalletId;
                    state.walletManagement.address = address;
                    state.walletManagement.publicKey = publicKey;
                    state.walletManagement.balance = balance.toString();
                    state.walletManagement.currentWallet = wallet;
                });

                await get().startWebSocketStreaming();
                log.info(`Created Ledger wallet ${getneratedWalletId} (${walletName})`);
                return getneratedWalletId;
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
                if (state.walletManagement.activeWalletId === walletId && state.walletManagement.currentWallet) {
                    log.info(`Wallet ${walletId} is already active, skipping switch`);
                    if (!state.walletManagement.isStreamingConnected) {
                        await get().startWebSocketStreaming();
                    }
                    return;
                }

                log.info(`Switching to wallet ${walletId} (${savedWallet.name})`);

                await get().stopWebSocketStreaming();

                let wallet = savedWallet.kitWalletId
                    ? state.walletCore.walletKit.getWallet(savedWallet.kitWalletId)
                    : undefined;

                if (!wallet) {
                    const walletAdapter = await state.createAdapterFromSavedWallet(
                        state.walletCore.walletKit,
                        savedWallet,
                    );

                    if (!walletAdapter) {
                        throw new Error(`Failed to create adapter for wallet ${savedWallet.name}`);
                    }

                    wallet = await state.walletCore.walletKit.addWallet(walletAdapter);
                    if (wallet && wallet.getWalletId() !== savedWallet.kitWalletId) {
                        const newKitWalletId = wallet.getWalletId();
                        set((state) => {
                            const savedWalletIndex = state.walletManagement.savedWallets.findIndex(
                                (w) => w.id === walletId,
                            );
                            if (savedWalletIndex !== -1) {
                                state.walletManagement.savedWallets[savedWalletIndex].kitWalletId = newKitWalletId;
                            }
                        });
                    }
                }

                if (!wallet) {
                    throw new Error('Failed to load wallet');
                }

                // Activate the wallet immediately, even if API calls fail
                let balance: string | undefined;
                try {
                    const balanceResult = await wallet.getBalance();
                    balance = balanceResult.toString();
                } catch (balanceError) {
                    log.warn('Failed to fetch balance during wallet switch (API may be down):', balanceError);
                }

                // Drop any in-flight events load for the previous wallet so the coalescing
                // guard doesn't hand this wallet the old wallet's request.
                inFlightEventsLoad = null;

                set((state) => {
                    state.walletManagement.activeWalletId = walletId;
                    state.walletManagement.address = savedWallet.address;
                    state.walletManagement.publicKey = savedWallet.publicKey;
                    state.walletManagement.balance = balance ?? state.walletManagement.balance;
                    state.walletManagement.currentWallet = wallet;
                    state.walletManagement.events = [];
                    state.walletManagement.eventsLoaded = false;
                    state.walletManagement.eventsError = false;
                    state.walletManagement.accountStatus = undefined;
                });

                await get().startWebSocketStreaming();
                void get()
                    .loadEvents()
                    .catch((err) => log.error('Error loading events after switching wallet:', err));

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

            const isRemovingActiveWallet = state.walletManagement.activeWalletId === walletId;
            const isLastWallet = state.walletManagement.savedWallets.length === 1;
            // Pick the next wallet to switch to BEFORE removing. Don't touch activeWalletId here —
            // switchWallet must see it still pointing at the removed wallet, otherwise it treats the
            // target as "already active" and early-returns without loading address/currentWallet.
            const nextActiveId =
                isRemovingActiveWallet && !isLastWallet
                    ? state.walletManagement.savedWallets.find((w) => w.id !== walletId)?.id
                    : undefined;

            set((state) => {
                state.walletManagement.savedWallets.splice(walletIndex, 1);

                if (isRemovingActiveWallet && isLastWallet) {
                    state.walletManagement.hasWallet = false;
                    state.walletManagement.isAuthenticated = false;
                    state.walletManagement.activeWalletId = undefined;
                    state.walletManagement.address = undefined;
                    state.walletManagement.publicKey = undefined;
                    state.walletManagement.balance = undefined;
                    state.walletManagement.currentWallet = undefined;
                    state.walletManagement.events = [];
                    state.walletManagement.eventsLoaded = false;
                    state.walletManagement.eventsError = false;
                    state.walletManagement.accountStatus = undefined;
                    state.walletManagement.pendingTransactions = [];
                    state.walletManagement.confirmedTraceIds = [];
                    state.walletManagement.confirmedExternalHashes = [];
                    state.walletManagement.isStreamingConnected = false;
                }
            });

            if (isRemovingActiveWallet && isLastWallet) {
                inFlightEventsLoad = null;
                void get().stopWebSocketStreaming();
            }

            log.info(`Removed wallet ${walletId}`);

            if (nextActiveId) {
                void get()
                    .switchWallet(nextActiveId)
                    .catch((err) => log.error('Error switching wallet after removal:', err));
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

                    const walletAdapter = await state.createAdapterFromSavedWallet(
                        state.walletCore.walletKit,
                        savedWallet,
                    );

                    if (!walletAdapter) {
                        log.warn(`Failed to create adapter for wallet ${savedWallet.name}`);
                        continue;
                    }

                    await state.walletCore.walletKit.addWallet(walletAdapter);
                }

                // Switch to active wallet — errors here should not block login
                try {
                    if (state.walletManagement.savedWallets.length > 0 && !state.walletManagement.activeWalletId) {
                        await get().switchWallet(state.walletManagement.savedWallets[0].id);
                    } else if (state.walletManagement.activeWalletId) {
                        await get().switchWallet(state.walletManagement.activeWalletId);
                    }
                } catch (switchError) {
                    log.warn('Failed to switch wallet during loadAllWallets (API may be down):', switchError);
                }

                set((state) => {
                    state.walletManagement.hasWallet = state.walletManagement.savedWallets.length > 0;
                    state.walletManagement.isAuthenticated = state.walletManagement.savedWallets.length > 0;
                });

                log.info('All wallets loaded successfully');
            } catch (error) {
                log.error('Error loading wallets:', error);
                // Still mark as authenticated if we have saved wallets —
                // the user should be able to enter the app even if API is down
                set((state) => {
                    state.walletManagement.hasWallet = state.walletManagement.savedWallets.length > 0;
                    state.walletManagement.isAuthenticated = state.walletManagement.savedWallets.length > 0;
                });
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
            void get().stopWebSocketStreaming();
            inFlightEventsLoad = null;
            set((state) => {
                state.walletManagement.isAuthenticated = false;
                state.walletManagement.hasWallet = false;
                state.walletManagement.savedWallets = [];
                state.walletManagement.activeWalletId = undefined;
                state.walletManagement.address = undefined;
                state.walletManagement.balance = undefined;
                state.walletManagement.publicKey = undefined;
                state.walletManagement.events = [];
                state.walletManagement.eventsLoaded = false;
                state.walletManagement.eventsError = false;
                state.walletManagement.accountStatus = undefined;
                state.walletManagement.pendingTransactions = [];
                state.walletManagement.confirmedTraceIds = [];
                state.walletManagement.confirmedExternalHashes = [];
                state.walletManagement.currentWallet = undefined;
                state.walletManagement.isStreamingConnected = false;
                state.tonConnect.pendingConnectRequestEvent = undefined;
                state.tonConnect.isConnectModalOpen = false;
                state.tonConnect.pendingTransactionRequestEvent = undefined;
                state.tonConnect.isTransactionModalOpen = false;
                state.tonConnect.pendingSignDataRequestEvent = undefined;
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
            }
        },

        startWebSocketStreaming: async () => {
            const state = get();
            if (!state.walletManagement.address || state.walletManagement.isStreamingConnected) {
                return;
            }

            const wallet = state.walletManagement.currentWallet;
            const network = wallet?.getNetwork();
            if (!network) return;

            const streaming = state.walletCore.walletKit?.streaming;

            if (!streaming) return;
            if (!streaming.hasProvider(network)) {
                log.info(
                    `No streaming provider registered for network ${network.chainId}; skipping WebSocket streaming`,
                );
                return;
            }

            activeStreamingUnwatchers.forEach((unwatch) => unwatch());
            activeStreamingUnwatchers = [];

            const address = state.walletManagement.address;

            const unwatchBalance = streaming.watchBalance(network, address, (update) => {
                set((s) => {
                    if (update.status === 'finalized' && s.walletManagement.balance !== update.rawBalance) {
                        s.walletManagement.balance = update.rawBalance;
                        log.info('Balance updated via WebSocket:', update.rawBalance);
                    }
                });
            });

            const unwatchJettons = streaming.watchJettons(network, address, (update) => {
                if (update.status === 'finalized') {
                    get().updateJettonBalanceFromStream(update.walletAddress, update.rawBalance, update.decimals);

                    const hasJetton = get().jettons.userJettons.some((j) =>
                        compareAddress(j.walletAddress, update.walletAddress),
                    );

                    if (!hasJetton) {
                        void get()
                            .refreshJettons()
                            .catch((err) => log.error('Error refreshing jettons after new jetton:', err));
                    }
                }
            });

            const unwatchTransactions = streaming.watchTransactions(network, address, (update) => {
                log.info(
                    'New transactions received via WebSocket for:',
                    update.address,
                    compareAddress(update.address, address),
                );
                get().handleStreamingTransactions(update);
            });

            const unwatchConnection = streaming.onConnectionChange(network, (connected) => {
                set((s) => {
                    s.walletManagement.isStreamingConnected = connected;
                });
            });

            activeStreamingUnwatchers.push(unwatchBalance, unwatchJettons, unwatchTransactions, unwatchConnection);

            log.info('WebSocket streaming started for address:', address);
        },

        stopWebSocketStreaming: async () => {
            activeStreamingUnwatchers.forEach((unwatch) => unwatch());
            activeStreamingUnwatchers = [];

            set((s) => {
                s.walletManagement.isStreamingConnected = false;
                s.walletManagement.pendingTransactions = [];
                s.walletManagement.confirmedTraceIds = [];
                s.walletManagement.confirmedExternalHashes = [];
            });
            log.info('WebSocket streaming stopped');
        },

        updateWebSocketSubscription: async () => {
            const state = get();
            if (!state.walletManagement.address) {
                return;
            }
            await get().stopWebSocketStreaming();
            await get().startWebSocketStreaming();
        },

        handleStreamingTransactions: (update: TransactionsUpdate) => {
            const state = get();
            const address = state.walletManagement.address;
            if (!address || !compareAddress(update.address, address)) {
                return;
            }

            if (update.status === 'invalidated' && update.traceHash) {
                set((s) => {
                    s.walletManagement.pendingTransactions = s.walletManagement.pendingTransactions.filter(
                        (p) => p.externalHash !== update.traceHash && p.traceId !== update.traceHash,
                    );
                });
                return;
            }

            const txs = update.transactions as Transaction[];
            if (!txs || txs.length === 0) return;

            // Sort by logicalTime ascending to identify the initiating transaction
            const txsSorted = [...txs].sort((a, b) => (BigInt(a.logicalTime) < BigInt(b.logicalTime) ? -1 : 1));
            const firstTx = txsSorted[0];

            // Derive a stable identifier: prefer traceExternalHash, fall back to hash of first tx
            const externalHash = firstTx.traceExternalHash || undefined;
            const traceId = firstTx.traceId ? Base64ToHex(firstTx.traceId) : firstTx.hash;

            // Build preview from the first tx's messages
            const hasExternalInMessage = firstTx.inMessage && !firstTx.inMessage.source;
            const outMsg = firstTx.outMessages?.[0];
            const inMsg = firstTx.inMessage;

            let previewType: 'send' | 'receive' | 'contract' = 'contract';
            let previewAmount = '0';
            let previewAddress = '';

            if (hasExternalInMessage && outMsg?.destination) {
                // External message with an outgoing transfer — user sent TON
                previewType = 'send';
                previewAmount = outMsg.value ?? '0';
                previewAddress = outMsg.destination;
            } else if (inMsg?.source && inMsg.value) {
                // Incoming internal message with value — user received TON
                previewType = 'receive';
                previewAmount = inMsg.value;
                previewAddress = inMsg.source;
            }

            set((s) => {
                const existingIndex = s.walletManagement.pendingTransactions.findIndex(
                    (p) => (externalHash && p.externalHash && p.externalHash === externalHash) || p.traceId === traceId,
                );

                const pendingTx = {
                    traceId,
                    externalHash,
                    action: undefined,
                    finality: update.status,
                    preview: {
                        type: previewType,
                        amount: previewAmount,
                        address: previewAddress,
                        timestamp: firstTx.now,
                    },
                };

                if (existingIndex !== -1) {
                    s.walletManagement.pendingTransactions[existingIndex] = {
                        ...s.walletManagement.pendingTransactions[existingIndex],
                        ...pendingTx,
                    };
                } else {
                    s.walletManagement.pendingTransactions.unshift(pendingTx);
                }
            });

            // On confirmed/finalized, refresh events and balance from REST
            if (update.status === 'confirmed' || update.status === 'finalized') {
                void get().loadEvents();
            }
        },

        // Default batch size 25. Fetching >= 25 traces is a workaround for a server-side
        // toncenter limitation: GET /api/v3/traces?limit=N returns 500 ("timeout: context
        // deadline exceeded") for small N (observed for N in 1..10) but succeeds for 25.
        // Not our bug — see the batch constant reused by the UI (use-transaction-rows).
        // offset === 0 is treated as a fresh first page (replaces the list); offset > 0 is a
        // "Load more" page that is appended to the accumulated events (deduped by eventId).
        loadEvents: async (limit = 25, offset = 0) => {
            const state = get();
            if (!state.walletManagement.address) {
                log.warn('No wallet address available to load events');
                return;
            }

            if (!state.walletCore.walletKit) {
                throw new Error('WalletKit not initialized');
            }

            // Coalesce overlapping requests for the SAME window onto the first in-flight load.
            // Prevents the duplicate concurrent /traces requests (dashboard preview + history
            // page + StrictMode double-mount + streaming refresh all firing at once). A request
            // for a different window (e.g. a "Load more" offset page) waits, then runs.
            const key = `${limit}:${offset}`;
            if (inFlightEventsLoad) {
                if (inFlightEventsLoad.key === key) {
                    return inFlightEventsLoad.promise;
                }
                const previous = inFlightEventsLoad.promise;
                await previous.catch(() => {});
                // Another matching request may have started while we awaited.
                if (inFlightEventsLoad?.key === key) {
                    return inFlightEventsLoad.promise;
                }
            }

            const run = (async () => {
                const startState = get();
                const address = startState.walletManagement.address;
                if (!address) return;

                const activeWallet = startState.walletManagement.savedWallets.find(
                    (w) => w.id === startState.walletManagement.activeWalletId,
                );
                const walletNetwork = activeWallet?.network || 'testnet';
                const apiClient = startState.walletCore.walletKit?.getApiClient(getChainNetwork(walletNetwork));
                if (!apiClient) return;

                set((s) => {
                    s.walletManagement.isLoadingEvents = true;
                });

                log.info('Loading events for address:', address, 'limit:', limit, 'offset:', offset);

                // Best-effort account status (fresh/uninit accounts report 'uninitialized'/'non-existing')
                // so the UI can tell "genuinely no transactions" from "still loading / failed".
                void apiClient
                    .getAccountState(address)
                    .then((account) => {
                        set((s) => {
                            if (s.walletManagement.address === address) {
                                s.walletManagement.accountStatus = account.status;
                            }
                        });
                    })
                    .catch((err) => log.warn('Failed to fetch account status:', err));

                // One quick retry on a transient toncenter timeout.
                let response: Awaited<ReturnType<typeof apiClient.getEvents>>;
                try {
                    response = await apiClient.getEvents({ account: address, limit, offset });
                } catch (error) {
                    if (isToncenterTimeout(error)) {
                        log.warn('getEvents timed out; retrying once');
                        await delay(600);
                        response = await apiClient.getEvents({ account: address, limit, offset });
                    } else {
                        throw error;
                    }
                }

                set((s) => {
                    // offset 0 = fresh first page (replace). offset > 0 = "Load more" page:
                    // append to what's already loaded and dedupe by eventId so a page overlap
                    // (e.g. a new tx shifting the window) can't produce duplicate rows.
                    if (offset > 0) {
                        const existing = s.walletManagement.events as Array<{ eventId?: string }>;
                        const seenEventIds = new Set<string>(
                            existing.map((ev) => ev.eventId).filter((id): id is string => !!id),
                        );
                        const appended = (response.events as Array<{ eventId?: string }>).filter(
                            (ev) => !ev.eventId || !seenEventIds.has(ev.eventId),
                        );
                        s.walletManagement.events = [...existing, ...appended];
                    } else {
                        s.walletManagement.events = response.events;
                    }
                    s.walletManagement.hasNextEvents = response.hasNext;
                    const eventTraceIds = new Set<string>();
                    const eventExtHashes = new Set<string>();
                    for (const ev of response.events as Array<{ eventId?: string; traceExternalHash?: string }>) {
                        if (ev.eventId) eventTraceIds.add(ev.eventId);
                        if (ev.traceExternalHash) eventExtHashes.add(Base64ToHex(ev.traceExternalHash));
                    }
                    s.walletManagement.confirmedTraceIds = [
                        ...s.walletManagement.confirmedTraceIds,
                        ...eventTraceIds,
                    ].slice(-50);
                    s.walletManagement.confirmedExternalHashes = [
                        ...s.walletManagement.confirmedExternalHashes,
                        ...eventExtHashes,
                    ].slice(-50);
                    s.walletManagement.pendingTransactions = s.walletManagement.pendingTransactions.filter(
                        (p) =>
                            !(p.traceId && eventTraceIds.has(p.traceId)) &&
                            !(p.externalHash && eventExtHashes.has(p.externalHash)),
                    );
                    s.walletManagement.eventsError = false;
                });

                log.info(`Loaded ${response.events.length} events`);
            })();

            const promise = run
                .catch((error) => {
                    log.error('Error loading events:', error);
                    set((s) => {
                        s.walletManagement.eventsError = true;
                    });
                })
                .finally(() => {
                    set((s) => {
                        s.walletManagement.isLoadingEvents = false;
                        s.walletManagement.eventsLoaded = true;
                    });
                    // Only clear if we're still the current load (a newer one may have replaced us).
                    if (inFlightEventsLoad?.promise === promise) {
                        inFlightEventsLoad = null;
                    }
                });

            inFlightEventsLoad = { key, promise };
            return promise;
        },

        getAvailableWallets: (): Wallet[] => {
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

        createAdapterFromSavedWallet: async (
            walletKit: ITonWalletKit,
            savedWallet: SavedWallet,
        ): Promise<WalletAdapter | undefined> => {
            const state = get();

            if (!state.auth.currentPassword) {
                throw new Error('Cannot load wallets: user is not authenticated');
            }

            let walletAdapter;
            const walletNetwork = savedWallet.network || 'testnet';

            if (savedWallet.walletType === 'ledger' && savedWallet.ledgerConfig) {
                if (!walletKitConfig?.createLedgerTransport) {
                    log.warn(`Skipping Ledger wallet ${savedWallet.id}: createLedgerTransport not provided`);
                    return;
                }

                walletAdapter = await createWalletAdapter({
                    useWalletInterfaceType: 'ledger',
                    ledgerAccountNumber: savedWallet.ledgerConfig.accountIndex,
                    storedLedgerConfig: savedWallet.ledgerConfig,
                    network: walletNetwork,
                    walletKit,
                    version: savedWallet.version || 'v4r2',
                    createLedgerTransport: walletKitConfig.createLedgerTransport,
                });
            } else if (savedWallet.encryptedMnemonic) {
                const mnemonicJson = await SimpleEncryption.decrypt(
                    savedWallet.encryptedMnemonic,
                    state.auth.currentPassword,
                );
                const mnemonic = JSON.parse(mnemonicJson) as string[];

                if (savedWallet.version === 'v5r1') {
                    walletAdapter = await createWalletAdapter({
                        mnemonic,
                        useWalletInterfaceType: savedWallet.walletInterfaceType,
                        ledgerAccountNumber: state.auth.ledgerAccountNumber,
                        storedLedgerConfig: undefined,
                        network: walletNetwork,
                        walletKit,
                        version: 'v5r1',
                    });
                } else {
                    walletAdapter = await createWalletAdapter({
                        mnemonic,
                        useWalletInterfaceType: savedWallet.walletInterfaceType,
                        ledgerAccountNumber: state.auth.ledgerAccountNumber,
                        storedLedgerConfig: undefined,
                        network: walletNetwork,
                        walletKit,
                        version: savedWallet.version || 'v4r2',
                    });
                }
            }

            return walletAdapter;
        },
    });
