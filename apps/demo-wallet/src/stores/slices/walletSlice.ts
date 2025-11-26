/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    TonWalletKit,
    type IWalletAdapter,
    type EventConnectRequest,
    type EventTransactionRequest,
    type EventSignDataRequest,
    type EventDisconnect,
    type IWallet,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    DefaultSignature,
    CHAIN,
    type ITonWalletKit,
    createDeviceInfo,
    createWalletManifest,
    type ToncenterTransaction,
    SEND_TRANSACTION_ERROR_CODES,
    MnemonicToKeyPair,
    type WalletSigner,
    Uint8ArrayToHex,
    WalletKitError,
    ERROR_CODES,
} from '@ton/walletkit';
import { createWalletInitConfigLedger, createLedgerPath, createWalletV4R2Ledger } from '@ton/v4ledger-adapter';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { toast } from 'sonner';
// import browser from 'webextension-polyfill';

import { SimpleEncryption } from '../../utils';
import { createComponentLogger } from '../../utils/logger';
import type {
    PreviewTransaction,
    LedgerConfig,
    SavedWallet,
    QueuedRequest,
    QueuedRequestData,
} from '../../types/wallet';
import type { SetState, WalletSliceCreator } from '../../types/store';
import { isExtension } from '../../utils/isExtension';
import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../../utils/walletManifest';

import {
    DISABLE_HTTP_BRIDGE,
    DISABLE_NETWORK_SEND,
    ENV_BRIDGE_URL,
    ENV_TON_API_KEY_MAINNET,
    ENV_TON_API_KEY_TESTNET,
} from '@/lib/env';

// Create logger for wallet slice
const log = createComponentLogger('WalletSlice');

// Queue management constants
const MAX_QUEUE_SIZE = 100;
const MODAL_CLOSE_DELAY = 500; // Delay after modal closes before showing next request
const REQUEST_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

// Initialize wallet kit instance
async function createWalletKitInstance(network: 'mainnet' | 'testnet' = 'testnet'): Promise<ITonWalletKit> {
    let jsBridgeTransport: typeof import('@/lib/extensionPopup').SendMessageToExtensionContent | undefined;
    let storage: ReturnType<typeof import('@/lib/extensionPopup').CreateExtensionStorageAdapter> | undefined;

    if (isExtension()) {
        const { SendMessageToExtensionContent, CreateExtensionStorageAdapter } = await import('@/lib/extensionPopup');
        jsBridgeTransport = SendMessageToExtensionContent;
        storage = CreateExtensionStorageAdapter();
    }

    const walletKit = new TonWalletKit({
        deviceInfo: createDeviceInfo(getTonConnectDeviceInfo()),
        walletManifest: createWalletManifest(getTonConnectWalletManifest()),

        bridge: {
            bridgeUrl: ENV_BRIDGE_URL,
            disableHttpConnection: DISABLE_HTTP_BRIDGE,
            jsBridgeTransport,
        },

        network: network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
        apiClient: {
            key: network === 'mainnet' ? ENV_TON_API_KEY_MAINNET : ENV_TON_API_KEY_TESTNET,
        },

        storage,

        analytics: {
            enabled: true,
        },

        dev: {
            disableNetworkSend: DISABLE_NETWORK_SEND,
        },
    }) as ITonWalletKit;

    log.info(`WalletKit initialized with network: ${network} ${isExtension() ? 'extension' : 'web'}`);
    return walletKit;
}

// Helper function to transform Toncenter transaction to our Transaction type
function transformToncenterTransaction(tx: ToncenterTransaction): PreviewTransaction {
    // Determine transaction type based on messages
    let type: 'send' | 'receive' = 'receive';
    let amount = '0';
    let address = '';

    // Check incoming message
    if (tx.in_msg && tx.in_msg.value) {
        amount = tx.in_msg.value;
        address = tx.in_msg.source || '';
        type = 'receive';
    }

    // Check outgoing messages - if there are any, it's likely a send transaction
    if (tx.out_msgs && tx.out_msgs.length > 0) {
        const mainOutMsg = tx.out_msgs[0];
        if (mainOutMsg.value) {
            amount = mainOutMsg.value;
            address = mainOutMsg.destination;
            type = 'send';
        }
    }

    // Determine status based on transaction description
    let status: 'pending' | 'confirmed' | 'failed' = 'confirmed';
    if (tx.description.aborted) {
        status = 'failed';
    } else if (!tx.description.compute_ph.success) {
        status = 'failed';
    }

    return {
        id: tx.hash,
        traceId: tx.trace_id || undefined,
        messageHash: tx.in_msg?.hash || '',
        type,
        amount,
        address,
        timestamp: tx.now * 1000, // Convert to milliseconds
        status,
        externalMessageHash: tx.trace_external_hash || undefined,
    };
}

async function createWalletAdapter(params: {
    mnemonic?: string[];
    useWalletInterfaceType: 'signer' | 'mnemonic' | 'ledger';
    ledgerAccountNumber?: number;
    storedLedgerConfig?: LedgerConfig;
    network: 'mainnet' | 'testnet';
    walletKit: ITonWalletKit;
    version: 'v5r1' | 'v4r2';
}): Promise<IWalletAdapter> {
    const {
        mnemonic,
        useWalletInterfaceType,
        ledgerAccountNumber = 0,
        storedLedgerConfig,
        network,
        walletKit,
        version = 'v5r1',
    } = params;

    while (!walletKit.isReady()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const chainNetwork = network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

    switch (useWalletInterfaceType) {
        case 'signer': {
            if (!mnemonic) {
                throw new Error('Mnemonic required for signer wallet type');
            }
            const keyPair = await MnemonicToKeyPair(mnemonic);

            // Create custom signer with confirmation dialog
            const customSigner: WalletSigner = {
                sign: async (bytes: Iterable<number>) => {
                    if (confirm('Are you sure you want to sign?')) {
                        return DefaultSignature(bytes, keyPair.secretKey);
                    }
                    throw new Error('User did not confirm');
                },
                publicKey: Uint8ArrayToHex(keyPair.publicKey),
            };

            // Create adapter with the appropriate version
            if (version === 'v5r1') {
                return await WalletV5R1Adapter.create(customSigner, {
                    client: walletKit.getApiClient(),
                    network: chainNetwork,
                });
            } else {
                return await WalletV4R2Adapter.create(customSigner, {
                    client: walletKit.getApiClient(),
                    network: chainNetwork,
                });
            }
        }
        case 'mnemonic': {
            if (!mnemonic) {
                throw new Error('Mnemonic required for mnemonic wallet type');
            }

            // Use Signer.fromMnemonic to create signer with publicKey
            const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

            // Create adapter with the appropriate version
            if (version === 'v5r1') {
                return await WalletV5R1Adapter.create(signer, {
                    client: walletKit.getApiClient(),
                    network: chainNetwork,
                });
            } else {
                return await WalletV4R2Adapter.create(signer, {
                    client: walletKit.getApiClient(),
                    network: chainNetwork,
                });
            }
        }
        case 'ledger': {
            // For Ledger, we need to request WebUSB transport
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof navigator === 'undefined' || !(navigator as any).usb) {
                throw new Error('WebUSB not supported in this environment');
            }

            try {
                // If we have stored config, use it to avoid connecting to device
                if (storedLedgerConfig) {
                    return createWalletV4R2Ledger(
                        createWalletInitConfigLedger({
                            createTransport: async () => await TransportWebHID.create(),
                            path: storedLedgerConfig.path,
                            publicKey: Uint8Array.from(storedLedgerConfig.publicKey),
                            version: storedLedgerConfig.version as 'v4r2',
                            network: storedLedgerConfig.network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
                            workchain: storedLedgerConfig.workchain,
                            walletId: storedLedgerConfig.walletId,
                            accountIndex: storedLedgerConfig.accountIndex,
                        }),
                        {
                            tonClient: walletKit.getApiClient(),
                        },
                    );
                }

                // Otherwise, create fresh connection
                const path = createLedgerPath(false, 0, ledgerAccountNumber);

                return createWalletV4R2Ledger(
                    createWalletInitConfigLedger({
                        createTransport: async () => await TransportWebHID.create(),
                        path,
                        version: 'v4r2',
                        network: chainNetwork,
                        workchain: 0,
                        accountIndex: ledgerAccountNumber,
                    }),
                    {
                        tonClient: walletKit.getApiClient(),
                    },
                );
            } catch (error) {
                log.error('Failed to create Ledger transport:', error);
                throw new Error('Failed to connect to Ledger device');
            }
        }
        default:
            throw new Error(`Invalid wallet interface type: ${useWalletInterfaceType}`);
    }
}

// Helper to generate unique wallet ID
function generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to generate default wallet name
function generateWalletName(existingWallets: SavedWallet[], type: 'mnemonic' | 'signer' | 'ledger'): string {
    const prefix = type === 'ledger' ? 'Ledger' : 'Wallet';
    let counter = existingWallets.filter((w) => w.name.startsWith(prefix)).length + 1;
    let name = `${prefix} ${counter}`;

    // Ensure unique name
    while (existingWallets.some((w) => w.name === name)) {
        counter++;
        name = `${prefix} ${counter}`;
    }

    return name;
}

export const createWalletSlice: WalletSliceCreator = (set: SetState, get) => ({
    wallet: {
        // Initial state
        walletKit: null,
        walletKitInitializer: null,
        isAuthenticated: false,
        hasWallet: false,
        savedWallets: [],
        activeWalletId: undefined,
        address: undefined,
        balance: undefined,
        publicKey: undefined,
        transactions: [],
        currentWallet: undefined,
        requestQueue: {
            items: [],
            currentRequestId: undefined,
            isProcessing: false,
        },
        pendingConnectRequest: undefined,
        isConnectModalOpen: false,
        pendingTransactionRequest: undefined,
        isTransactionModalOpen: false,
        pendingSignDataRequest: undefined,
        isSignDataModalOpen: false,
        disconnectedSessions: [],
    },

    // Load all saved wallets into WalletKit
    loadSavedWalletsIntoKit: async (walletKit: ITonWalletKit) => {
        const state = get();
        if (!state.auth.currentPassword) {
            log.warn('Cannot load wallets: user not authenticated');
            return;
        }

        const savedWallets = state.wallet.savedWallets;
        if (savedWallets.length === 0) {
            log.info('No saved wallets to load');
            return;
        }

        log.info(`Loading ${savedWallets.length} saved wallets into WalletKit`);
        const network = state.auth.network || 'testnet';

        for (const savedWallet of savedWallets) {
            try {
                let walletAdapter: IWalletAdapter;

                if (savedWallet.walletType === 'ledger' && savedWallet.ledgerConfig) {
                    // Load Ledger wallet
                    walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network,
                        walletKit,
                        version: savedWallet.version || 'v4r2',
                    });
                } else if (savedWallet.encryptedMnemonic) {
                    // Load mnemonic/signer wallet
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
                        network,
                        walletKit,
                        version: savedWallet.version || 'v5r1',
                    });
                } else {
                    log.warn(`Skipping wallet ${savedWallet.id}: no mnemonic or ledger config`);
                    continue;
                }

                // debugger;

                await walletKit.addWallet(walletAdapter);
                log.info(`Loaded wallet ${savedWallet.name} (${savedWallet.address})`);
            } catch (error) {
                log.error(`Failed to load wallet ${savedWallet.name}:`, error);
            }
        }
    },

    initializeWalletKit: async (network: 'mainnet' | 'testnet' = 'testnet') => {
        const state = get();

        // Check if we need to reinitialize
        if (state.wallet.walletKit) {
            const currentNetwork = state.wallet.walletKit.getNetwork();
            const targetNetwork = network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

            if (currentNetwork === targetNetwork) {
                log.info(`WalletKit already initialized with network: ${network}`);
                return;
            }

            // Cleanup existing instance
            log.info(`Reinitializing WalletKit to ${network}`);
            try {
                const existingWallets = state.wallet.walletKit.getWallets();
                log.info(`Clearing ${existingWallets.length} existing wallets before reinitialization`);
            } catch (error) {
                log.warn('Error during cleanup:', error);
            }
        }

        // Create new instance
        const walletKit = createWalletKitInstance(network);

        let initResolve: () => void;
        let initReject: (error: Error) => void;
        let initializer = new Promise<void>((resolve, reject) => {
            initResolve = resolve;
            initReject = reject;
        });

        set((state) => {
            state.wallet.walletKitInitializer = initializer;
        });
        walletKit
            .then(async (walletKit) => {
                // Set up wallet kit event listeners
                const onTransactionRequest = async (event: EventTransactionRequest) => {
                    const wallet = await walletKit.getWallet(event.walletAddress ?? '');
                    if (!wallet) {
                        log.error('Wallet not found for transaction request');
                        return;
                    }

                    const balance = await wallet.getBalance();
                    const minNeededBalance = event.request.messages.reduce(
                        (acc, message) => acc + BigInt(message.amount),
                        0n,
                    );
                    if (BigInt(balance) < minNeededBalance) {
                        await walletKit.rejectTransactionRequest(event, {
                            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                            message: 'Insufficient balance',
                        });
                        return;
                    }

                    get().enqueueRequest({
                        type: 'transaction',
                        request: event,
                    });
                };
                walletKit.onConnectRequest((event) => {
                    log.info('Connect request received:', event);
                    if (event?.preview?.manifestFetchErrorCode) {
                        log.error(
                            'Connect request received with manifest fetch error:',
                            event?.preview?.manifestFetchErrorCode,
                        );
                        walletKit.rejectConnectRequest(
                            event,
                            event?.preview?.manifestFetchErrorCode == 2
                                ? 'App manifest not found'
                                : event?.preview?.manifestFetchErrorCode == 3
                                  ? 'App manifest content error'
                                  : undefined,
                            event.preview.manifestFetchErrorCode,
                        );
                        return;
                    }
                    get().enqueueRequest({
                        type: 'connect',
                        request: event,
                    });
                });

                walletKit.onTransactionRequest(onTransactionRequest);

                walletKit.onSignDataRequest((event) => {
                    log.info('Sign data request received:', event);
                    get().enqueueRequest({
                        type: 'signData',
                        request: event,
                    });
                });

                walletKit.onDisconnect((event) => {
                    log.info('Disconnect event received:', event);
                    get().handleDisconnectEvent(event);
                });

                log.info('WalletKit listeners initialized');

                set((state) => {
                    state.wallet.walletKit = walletKit;
                });

                // Load all saved wallets into the WalletKit instance
                await get().loadSavedWalletsIntoKit(walletKit);

                return walletKit;
            })
            .then(() => {
                initResolve();
            })
            .catch((error) => {
                initReject(error);
            });
    },

    // Create a new wallet
    createWallet: async (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const walletId = generateWalletId();
            const walletName =
                name || generateWalletName(state.wallet.savedWallets, state.auth.useWalletInterfaceType || 'mnemonic');

            // Encrypt and store the mnemonic
            const encryptedMnemonic = await SimpleEncryption.encrypt(
                JSON.stringify(mnemonic),
                state.auth.currentPassword,
            );

            if (!version) {
                throw new Error('Version is required');
            }

            // Create wallet using walletkit
            const network = state.auth.network || 'testnet';
            const walletAdapter = await createWalletAdapter({
                mnemonic,
                useWalletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                storedLedgerConfig: undefined,
                network,
                walletKit: state.wallet.walletKit,
                version,
            });

            const wallet = await state.wallet.walletKit.addWallet(walletAdapter);
            // const wallets = state.wallet.walletKit.getWallets();
            // const wallet = wallets.find((w) => w.getAddress() === walletAdapter.getAddress());

            if (!wallet) {
                throw new Error('Failed to find created wallet');
            }

            // Get wallet info
            const address = wallet.getAddress();

            // // Check if wallet with this address already exists
            // const existingWallet = state.wallet.savedWallets.find((w) => w.address === address);
            // if (existingWallet) {
            //     log.warn(`Wallet with address ${address} already exists`);
            //     state.wallet.walletKit.removeWallet(wallet);
            //     throw new Error('A wallet with this address already exists');
            // }

            // const balance = await wallet.getBalance();
            const publicKey = wallet.getPublicKey();

            // Create saved wallet entry
            const savedWallet: SavedWallet = {
                id: walletId,
                name: walletName,
                address,
                publicKey,
                encryptedMnemonic,
                walletType: state.auth.useWalletInterfaceType || 'mnemonic',
                walletInterfaceType: state.auth.useWalletInterfaceType || 'mnemonic',
                version: version,
                createdAt: Date.now(),
            };

            // Update state
            set((state) => {
                state.wallet.savedWallets.push(savedWallet);
                state.wallet.hasWallet = true;
                state.wallet.isAuthenticated = true;
                state.wallet.activeWalletId = walletId;
                state.wallet.address = address;
                state.wallet.publicKey = publicKey;
                state.wallet.balance = '0';
                // balance.toString();
                state.wallet.currentWallet = wallet;
            });

            log.info(`Created wallet ${walletId} (${walletName})`);
            return walletId;
        } catch (error) {
            log.error('Error creating wallet:', error);
            throw error instanceof Error ? error : new Error('Failed to create wallet');
        }
    },

    importWallet: async (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => {
        // Same as create wallet
        return get().createWallet(mnemonic, name, version);
    },

    createLedgerWallet: async (name?: string) => {
        const state = get();
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (state.auth.useWalletInterfaceType !== 'ledger') {
            throw new Error('Wallet type must be set to ledger');
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const walletId = generateWalletId();
            const walletName = name || generateWalletName(state.wallet.savedWallets, 'ledger');
            const version = 'v4r2';

            // Create wallet using walletkit with Ledger configuration
            const network = state.auth.network || 'testnet';
            const walletAdapter = await createWalletAdapter({
                useWalletInterfaceType: 'ledger',
                ledgerAccountNumber: state.auth.ledgerAccountNumber,
                storedLedgerConfig: undefined,
                network,
                walletKit: state.wallet.walletKit,
                version: version,
            });

            const wallet = await state.wallet.walletKit.addWallet(walletAdapter);
            // const wallets = state.wallet.walletKit.getWallets();
            // const wallet = wallets.find((w) => w.getAddress() === walletAdapter.getAddress());

            if (!wallet) {
                throw new Error('Failed to find created Ledger wallet');
            }

            // Get wallet info
            const address = wallet.getAddress();

            // Check if wallet with this address already exists
            const existingWallet = state.wallet.savedWallets.find((w) => w.address === address);
            if (existingWallet) {
                log.warn(`Wallet with address ${address} already exists`);
                state.wallet.walletKit.removeWallet(wallet);
                throw new Error('A wallet with this address already exists');
            }

            const balance = await wallet.getBalance();
            const publicKey = wallet.getPublicKey();

            // Store Ledger configuration
            const ledgerPath = createLedgerPath(false, 0, state.auth.ledgerAccountNumber || 0);
            const ledgerConfig: LedgerConfig = {
                publicKey: publicKey,
                path: ledgerPath,
                walletId: 698983191,
                version: version,
                network: network,
                workchain: 0,
                accountIndex: state.auth.ledgerAccountNumber || 0,
            };

            // Create saved wallet entry
            const savedWallet: SavedWallet = {
                id: walletId,
                name: walletName,
                address,
                publicKey,
                ledgerConfig,
                walletType: 'ledger',
                walletInterfaceType: 'ledger',
                version: version,
                createdAt: Date.now(),
            };

            // Update state
            set((state) => {
                state.wallet.savedWallets.push(savedWallet);
                state.wallet.hasWallet = true;
                state.wallet.isAuthenticated = true;
                state.wallet.activeWalletId = walletId;
                state.wallet.address = address;
                state.wallet.publicKey = publicKey;
                state.wallet.balance = balance.toString();
                state.wallet.currentWallet = wallet;
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
        // debugger;
        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        const savedWallet = state.wallet.savedWallets.find((w) => w.id === walletId);
        if (!savedWallet) {
            throw new Error('Wallet not found');
        }

        try {
            log.info(`Switching to wallet ${walletId} (${savedWallet.name})`);

            // Check if wallet is already loaded in WalletKit
            let wallet = state.wallet.walletKit.getWallets().find((w) => w.getAddress() === savedWallet.address);

            // If not loaded, load it
            if (!wallet) {
                const network = state.auth.network || 'testnet';

                if (savedWallet.walletType === 'ledger') {
                    const walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig?.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network,
                        walletKit: state.wallet.walletKit,
                        version: savedWallet.version || 'v4r2',
                    });

                    await state.wallet.walletKit.addWallet(walletAdapter);
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
                        network,
                        walletKit: state.wallet.walletKit,
                        version: savedWallet.version || 'v5r1',
                    });

                    await state.wallet.walletKit.addWallet(walletAdapter);
                }

                // Get the newly loaded wallet
                wallet = state.wallet.walletKit.getWallets().find((w) => w.getAddress() === savedWallet.address);
            }

            if (!wallet) {
                throw new Error('Failed to load wallet');
            }

            // Get fresh balance
            const balance = await wallet.getBalance();

            // Update state
            set((state) => {
                state.wallet.activeWalletId = walletId;
                state.wallet.address = savedWallet.address;
                state.wallet.publicKey = savedWallet.publicKey;
                state.wallet.balance = balance.toString();
                state.wallet.currentWallet = wallet;
                state.wallet.transactions = []; // Clear transactions for new wallet
            });

            // Load transactions for the new wallet
            await get().loadTransactions();

            log.info(`Switched to wallet ${walletId} successfully`);
        } catch (error) {
            log.error('Error switching wallet:', error);
            throw new Error('Failed to switch wallet');
        }
    },

    removeWallet: (walletId: string) => {
        const state = get();
        const walletIndex = state.wallet.savedWallets.findIndex((w) => w.id === walletId);

        if (walletIndex === -1) {
            throw new Error('Wallet not found');
        }

        set((state) => {
            // Remove the wallet from saved wallets
            state.wallet.savedWallets.splice(walletIndex, 1);

            // If this was the active wallet, switch to another or clear
            if (state.wallet.activeWalletId === walletId) {
                if (state.wallet.savedWallets.length > 0) {
                    // Switch to first available wallet
                    const newActiveId = state.wallet.savedWallets[0].id;
                    state.wallet.activeWalletId = newActiveId;
                    // Note: switchWallet should be called after this to properly load the wallet
                } else {
                    // No wallets left, clear everything
                    state.wallet.hasWallet = false;
                    state.wallet.isAuthenticated = false;
                    state.wallet.activeWalletId = undefined;
                    state.wallet.address = undefined;
                    state.wallet.publicKey = undefined;
                    state.wallet.balance = undefined;
                    state.wallet.currentWallet = undefined;
                    state.wallet.transactions = [];
                }
            }
        });

        log.info(`Removed wallet ${walletId}`);

        // If we switched to a new active wallet, load it
        const newState = get();
        if (newState.wallet.activeWalletId && newState.wallet.activeWalletId !== walletId) {
            get().switchWallet(newState.wallet.activeWalletId);
        }
    },

    renameWallet: (walletId: string, newName: string) => {
        set((state) => {
            const wallet = state.wallet.savedWallets.find((w) => w.id === walletId);
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

        if (!state.wallet.walletKit) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(undefined);
                }, 1000);
            });
        }

        state = get();
        if (state.wallet.walletKitInitializer) {
            await state.wallet.walletKitInitializer;
        }

        state = get();

        if (!state.auth.currentPassword) {
            throw new Error('User not authenticated');
        }
        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info(`Loading ${state.wallet.savedWallets.length} saved wallets`);

            // Load all saved wallets into WalletKit
            for (const savedWallet of state.wallet.savedWallets) {
                // Check if already loaded
                const existingWallet = state.wallet.walletKit
                    .getWallets()
                    .find((w) => w.getAddress() === savedWallet.address);

                if (existingWallet) {
                    log.info(`Wallet ${savedWallet.id} already loaded`);
                    continue;
                }

                const network = state.auth.network || 'testnet';

                if (savedWallet.walletType === 'ledger') {
                    const walletAdapter = await createWalletAdapter({
                        useWalletInterfaceType: 'ledger',
                        ledgerAccountNumber: savedWallet.ledgerConfig?.accountIndex,
                        storedLedgerConfig: savedWallet.ledgerConfig,
                        network,
                        walletKit: state.wallet.walletKit,
                        version: savedWallet.version || 'v4r2',
                    });

                    await state.wallet.walletKit.addWallet(walletAdapter);
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
                        network,
                        walletKit: state.wallet.walletKit,
                        version: savedWallet.version || 'v5r1',
                    });

                    await state.wallet.walletKit.addWallet(walletAdapter);
                }
            }

            // If we have saved wallets but no active wallet, activate the first one
            if (state.wallet.savedWallets.length > 0 && !state.wallet.activeWalletId) {
                await get().switchWallet(state.wallet.savedWallets[0].id);
            } else if (state.wallet.activeWalletId) {
                // Load the active wallet
                await get().switchWallet(state.wallet.activeWalletId);
            }

            set((state) => {
                state.wallet.hasWallet = state.wallet.savedWallets.length > 0;
                state.wallet.isAuthenticated = state.wallet.savedWallets.length > 0;
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
            // Get the wallet to decrypt
            const targetWalletId = walletId || state.wallet.activeWalletId;
            if (!targetWalletId) {
                log.error('No wallet ID provided or active');
                return null;
            }

            const savedWallet = state.wallet.savedWallets.find((w) => w.id === targetWalletId);
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
            state.wallet.isAuthenticated = false;
            state.wallet.hasWallet = false;
            state.wallet.savedWallets = [];
            state.wallet.activeWalletId = undefined;
            state.wallet.address = undefined;
            state.wallet.balance = undefined;
            state.wallet.publicKey = undefined;
            state.wallet.transactions = [];
            state.wallet.currentWallet = undefined;
            state.wallet.pendingConnectRequest = undefined;
            state.wallet.isConnectModalOpen = false;
            state.wallet.pendingTransactionRequest = undefined;
            state.wallet.isTransactionModalOpen = false;
            state.wallet.pendingSignDataRequest = undefined;
            state.wallet.isSignDataModalOpen = false;
        });
    },

    updateBalance: async () => {
        const state = get();
        if (!state.wallet.currentWallet) {
            log.warn('No wallet available to update balance');
            return;
        }

        try {
            const balance = await state.wallet.currentWallet.getBalance();
            const balanceString = balance.toString();

            set((state) => {
                state.wallet.balance = balanceString;
            });
        } catch (error) {
            log.error('Error updating balance:', error);
            throw new Error('Failed to update balance');
        }
    },

    addTransaction: (transaction: PreviewTransaction) => {
        set((state) => {
            state.wallet.transactions = [transaction, ...state.wallet.transactions];
        });
    },

    loadTransactions: async (limit = 10) => {
        const state = get();
        if (!state.wallet.address) {
            log.warn('No wallet address available to load transactions');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info('Loading transactions for address:', state.wallet.address);

            const response = await state.wallet.walletKit.getApiClient().getAccountTransactions({
                address: [state.wallet.address],
                limit,
                offset: 0,
            });

            const transformedTransactions = response.transactions.map((tx: ToncenterTransaction) =>
                transformToncenterTransaction(tx),
            );

            set((state) => {
                state.wallet.transactions = transformedTransactions;
            });

            log.info(`Loaded ${transformedTransactions.length} transactions`);
        } catch (error) {
            log.error('Error loading transactions:', error);
            throw new Error('Failed to load transactions');
        }
    },

    handleTonConnectUrl: async (url: string) => {
        const state = get();
        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            log.info('Handling TON Connect URL:', url);
            await state.wallet.walletKit.handleTonConnectUrl(url);
        } catch (error) {
            log.error('Failed to handle TON Connect URL:', error);
            throw new Error('Failed to process TON Connect link');
        }
    },

    showConnectRequest: (request: EventConnectRequest) => {
        set((state) => {
            state.wallet.pendingConnectRequest = request;
            state.wallet.isConnectModalOpen = true;
        });
    },

    approveConnectRequest: async (selectedWallet: IWallet) => {
        const state = get();
        if (!state.wallet.pendingConnectRequest) {
            log.error('No pending connect request to approve');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            const updatedRequest: EventConnectRequest = {
                ...state.wallet.pendingConnectRequest,
                walletAddress: selectedWallet.getAddress(),
            };

            await state.wallet.walletKit.approveConnectRequest(updatedRequest);

            set((state) => {
                state.wallet.pendingConnectRequest = undefined;
                state.wallet.isConnectModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
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

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.wallet.walletKit.rejectConnectRequest(state.wallet.pendingConnectRequest, reason);

            set((state) => {
                state.wallet.pendingConnectRequest = undefined;
                state.wallet.isConnectModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
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

    showTransactionRequest: (request: EventTransactionRequest) => {
        set((state) => {
            state.wallet.pendingTransactionRequest = request;
            state.wallet.isTransactionModalOpen = true;
        });
    },

    approveTransactionRequest: async () => {
        const state = get();
        if (!state.wallet.pendingTransactionRequest) {
            log.error('No pending transaction request to approve');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            try {
                await state.wallet.walletKit.approveTransactionRequest(state.wallet.pendingTransactionRequest);
                setTimeout(() => {
                    set((state) => {
                        state.wallet.pendingTransactionRequest = undefined;
                        state.wallet.isTransactionModalOpen = false;
                    });

                    // Clear from queue and process next after modal closes
                    state.clearCurrentRequestFromQueue();
                }, 3000); // 3 second delay for success animation
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                log.error('Failed to approve transaction request:', state.wallet.pendingTransactionRequest);
                if (error?.message?.toLocaleLowerCase()?.includes('ledger')) {
                    toast.error('Could not approve transaction request with Ledger, please unlock it and open TON App');
                } else {
                    toast.error('Could not approve transaction request');
                    setTimeout(() => {
                        set((state) => {
                            state.wallet.pendingTransactionRequest = undefined;
                            state.wallet.isTransactionModalOpen = false;
                        });

                        // Clear from queue and process next after modal closes
                        state.clearCurrentRequestFromQueue();
                    }, 3000);
                }
            }
        } catch (error) {
            log.error('Failed to approve transaction request:', error);
            throw error;
        }
    },

    rejectTransactionRequest: async (reason?: string) => {
        const state = get();
        if (!state.wallet.pendingTransactionRequest) {
            log.error('No pending transaction request to reject');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.wallet.walletKit.rejectTransactionRequest(state.wallet.pendingTransactionRequest, reason);

            set((state) => {
                state.wallet.pendingTransactionRequest = undefined;
                state.wallet.isTransactionModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to reject transaction request:', error);
            if (error instanceof WalletKitError && error.code === ERROR_CODES.SESSION_NOT_FOUND) {
                set((state) => {
                    state.wallet.pendingTransactionRequest = undefined;
                    state.wallet.isTransactionModalOpen = false;
                });
                toast.error('Could not properly reject transaction request: Session not found');

                state.clearCurrentRequestFromQueue();
                return;
            }
            throw error;
        }
    },

    closeTransactionModal: () => {
        set((state) => {
            state.wallet.isTransactionModalOpen = false;
            state.wallet.pendingTransactionRequest = undefined;
        });
    },

    showSignDataRequest: (request: EventSignDataRequest) => {
        set((state) => {
            state.wallet.pendingSignDataRequest = request;
            state.wallet.isSignDataModalOpen = true;
        });
    },

    approveSignDataRequest: async () => {
        const state = get();
        if (!state.wallet.pendingSignDataRequest) {
            log.error('No pending sign data request to approve');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.wallet.walletKit.signDataRequest(state.wallet.pendingSignDataRequest);

            // Delay closing the modal to allow success animation to show
            setTimeout(() => {
                set((state) => {
                    state.wallet.pendingSignDataRequest = undefined;
                    state.wallet.isSignDataModalOpen = false;
                });

                // Clear from queue and process next after modal closes
                state.clearCurrentRequestFromQueue();
            }, 3000); // 3 second delay for success animation
        } catch (error) {
            log.error('Failed to approve sign data request:', error);
            throw error;
        }
    },

    rejectSignDataRequest: async (reason?: string) => {
        const state = get();
        if (!state.wallet.pendingSignDataRequest) {
            log.error('No pending sign data request to reject');
            return;
        }

        if (!state.wallet.walletKit) {
            throw new Error('WalletKit not initialized');
        }

        try {
            await state.wallet.walletKit.rejectSignDataRequest(state.wallet.pendingSignDataRequest, reason);

            set((state) => {
                state.wallet.pendingSignDataRequest = undefined;
                state.wallet.isSignDataModalOpen = false;
            });

            state.clearCurrentRequestFromQueue();
        } catch (error) {
            log.error('Failed to reject sign data request:', error);
            throw error;
        }
    },

    closeSignDataModal: () => {
        set((state) => {
            state.wallet.isSignDataModalOpen = false;
            state.wallet.pendingSignDataRequest = undefined;
        });
    },

    handleDisconnectEvent: (event: EventDisconnect) => {
        log.info('Disconnect event received:', event);

        set((state) => {
            state.wallet.disconnectedSessions.push({
                walletAddress: event.walletAddress,
                reason: event.reason,
                timestamp: Date.now(),
            });
        });
    },

    clearDisconnectNotifications: () => {
        set((state) => {
            state.wallet.disconnectedSessions = [];
        });
    },

    getAvailableWallets: () => {
        const state = get();
        if (!state.wallet.walletKit) {
            return [];
        }
        return state.wallet.walletKit.getWallets();
    },

    getActiveWallet: () => {
        const state = get();
        if (!state.wallet.activeWalletId) {
            return undefined;
        }
        return state.wallet.savedWallets.find((w) => w.id === state.wallet.activeWalletId);
    },

    // Queue management actions
    enqueueRequest: (request: QueuedRequestData) => {
        const state = get();

        // Generate unique ID
        const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Check if queue is at max capacity
        if (state.wallet.requestQueue.items.length >= MAX_QUEUE_SIZE) {
            log.warn('Queue is full, attempting to clear expired requests');

            // Try to clear expired requests first
            get().clearExpiredRequests();

            // Check again after clearing
            const updatedState = get();
            if (updatedState.wallet.requestQueue.items.length >= MAX_QUEUE_SIZE) {
                log.error('Queue overflow: cannot add more requests');
                toast.error(
                    `Request queue is full (${MAX_QUEUE_SIZE} items). Please approve or reject pending requests.`,
                );
                return;
            }
        }

        const now = Date.now();
        const queuedRequest: QueuedRequest = {
            ...request,
            id: requestId,
            timestamp: now,
            expiresAt: now + REQUEST_EXPIRATION_TIME,
        };

        set((state) => {
            state.wallet.requestQueue.items.push(queuedRequest);
        });

        log.info(`Enqueued ${request.type} request`, {
            requestId,
            queueSize: state.wallet.requestQueue.items.length + 1,
        });

        // Process the request if not currently processing
        if (!state.wallet.requestQueue.isProcessing) {
            get().processNextRequest();
        }
    },

    processNextRequest: () => {
        const state = get();

        // Check if already processing
        if (state.wallet.requestQueue.isProcessing) {
            log.info('Already processing a request, skipping');
            return;
        }

        // Get next request from queue
        const nextRequest = state.wallet.requestQueue.items[0];
        if (!nextRequest) {
            log.info('No more requests in queue');
            return;
        }

        // Check if request has expired
        if (nextRequest.expiresAt < Date.now()) {
            log.warn('Next request has expired, removing and trying next', { requestId: nextRequest.id });
            set((state) => {
                state.wallet.requestQueue.items.shift();
            });
            get().processNextRequest();
            return;
        }

        log.info(`Processing ${nextRequest.type} request`, { requestId: nextRequest.id });

        // Mark as processing
        set((state) => {
            state.wallet.requestQueue.isProcessing = true;
            state.wallet.requestQueue.currentRequestId = nextRequest.id;
        });

        // Show the appropriate modal based on request type
        if (nextRequest.type === 'connect') {
            get().showConnectRequest(nextRequest.request as EventConnectRequest);
        } else if (nextRequest.type === 'transaction') {
            get().showTransactionRequest(nextRequest.request as EventTransactionRequest);
        } else if (nextRequest.type === 'signData') {
            get().showSignDataRequest(nextRequest.request as EventSignDataRequest);
        }
    },

    clearExpiredRequests: () => {
        const now = Date.now();
        set((state) => {
            const originalLength = state.wallet.requestQueue.items.length;
            state.wallet.requestQueue.items = state.wallet.requestQueue.items.filter((item) => item.expiresAt > now);
            const removedCount = originalLength - state.wallet.requestQueue.items.length;
            if (removedCount > 0) {
                log.info(`Cleared ${removedCount} expired requests from queue`);
            }
        });
    },

    getCurrentRequest: () => {
        const state = get();
        if (!state.wallet.requestQueue.currentRequestId) {
            return undefined;
        }
        return state.wallet.requestQueue.items.find((item) => item.id === state.wallet.requestQueue.currentRequestId);
    },

    // Helper to clear current request from queue and process next
    clearCurrentRequestFromQueue: () => {
        set((state) => {
            const currentId = state.wallet.requestQueue.currentRequestId;
            state.wallet.requestQueue.items = state.wallet.requestQueue.items.filter((item) => item.id !== currentId);
            state.wallet.requestQueue.currentRequestId = undefined;
            state.wallet.requestQueue.isProcessing = false;
        });

        // Delay before processing next request
        setTimeout(() => {
            get().processNextRequest();
        }, MODAL_CLOSE_DELAY);
    },
});
