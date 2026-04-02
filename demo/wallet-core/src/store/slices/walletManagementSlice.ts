/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { compareAddress, Base64NormalizeUrl, HexToBase64, Network } from '@ton/walletkit';
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
                    state.walletManagement.balance = '0';
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

                set((state) => {
                    state.walletManagement.activeWalletId = walletId;
                    state.walletManagement.address = savedWallet.address;
                    state.walletManagement.publicKey = savedWallet.publicKey;
                    state.walletManagement.balance = balance ?? state.walletManagement.balance;
                    state.walletManagement.currentWallet = wallet;
                    state.walletManagement.events = [];
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

            set((state) => {
                state.walletManagement.savedWallets.splice(walletIndex, 1);

                if (isRemovingActiveWallet) {
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
                        state.walletManagement.pendingTransactions = [];
                        state.walletManagement.confirmedTraceIds = [];
                        state.walletManagement.confirmedExternalHashes = [];
                        state.walletManagement.isStreamingConnected = false;
                    }
                }
            });

            if (isRemovingActiveWallet && isLastWallet) {
                void get().stopWebSocketStreaming();
            }

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
            set((state) => {
                state.walletManagement.isAuthenticated = false;
                state.walletManagement.hasWallet = false;
                state.walletManagement.savedWallets = [];
                state.walletManagement.activeWalletId = undefined;
                state.walletManagement.address = undefined;
                state.walletManagement.balance = undefined;
                state.walletManagement.publicKey = undefined;
                state.walletManagement.events = [];
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
            const traceId = firstTx.traceId || firstTx.hash;

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
                log.info(
                    'Loading events for address:',
                    state.walletManagement.address,
                    'limit:',
                    limit,
                    'offset:',
                    offset,
                );

                const activeWallet = state.walletManagement.savedWallets.find(
                    (w) => w.id === state.walletManagement.activeWalletId,
                );
                const walletNetwork = activeWallet?.network || 'testnet';

                const response = await state.walletCore.walletKit
                    .getApiClient(getChainNetwork(walletNetwork))
                    .getEvents({
                        account: state.walletManagement.address,
                        limit,
                        offset,
                    });

                set((state) => {
                    state.walletManagement.events = response.events;
                    state.walletManagement.hasNextEvents = response.hasNext;
                    // Remove pending that now appear in history. trace_id and trace_external_hash are different - match each to its own.
                    const eventTraceIds = new Set<string>();
                    const eventExtHashes = new Set<string>();
                    for (const ev of response.events as Array<{ eventId?: string; traceExternalHash?: string }>) {
                        if (ev.eventId)
                            eventTraceIds.add(
                                Base64NormalizeUrl(HexToBase64(ev.eventId as Parameters<typeof HexToBase64>[0])),
                            );
                        if (ev.traceExternalHash) eventExtHashes.add(Base64NormalizeUrl(ev.traceExternalHash));
                    }
                    state.walletManagement.confirmedTraceIds = [
                        ...state.walletManagement.confirmedTraceIds,
                        ...eventTraceIds,
                    ].slice(-50);
                    state.walletManagement.confirmedExternalHashes = [
                        ...state.walletManagement.confirmedExternalHashes,
                        ...eventExtHashes,
                    ].slice(-50);
                    state.walletManagement.pendingTransactions = state.walletManagement.pendingTransactions.filter(
                        (p) =>
                            !(p.traceIdFromFirstTx && eventTraceIds.has(Base64NormalizeUrl(p.traceIdFromFirstTx))) &&
                            !(p.traceId && eventTraceIds.has(Base64NormalizeUrl(p.traceId))) &&
                            !(p.externalHash && eventExtHashes.has(Base64NormalizeUrl(p.externalHash))),
                    );
                });

                log.info(`Loaded ${response.events.length} events`);
            } catch (error) {
                log.error('Error loading events:', error);
            }
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
