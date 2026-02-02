/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    Network,
    LocalStorageAdapter,
    StakingManager,
    TonStakersStakingProvider,
    createDeviceInfo,
    createWalletManifest,
    ParseStack,
} from '@ton/walletkit';
import type { Wallet, ApiClient } from '@ton/walletkit';
import { Address, beginCell, toNano, fromNano } from '@ton/core';
import { CONTRACT } from '@ton/walletkit';
import type { Base64String } from '@ton/walletkit';

// Storage keys
const STORAGE_KEY_SEED = 'staking-demo:seed';
const STORAGE_KEY_NETWORK = 'staking-demo:network';
const STORAGE_KEY_WALLET_ADDRESS = 'staking-demo:wallet-address';

// Environment variables (Vite injects these as import.meta.env.VITE_*)
const ENV_WALLET_MNEMONIC = import.meta.env.VITE_WALLET_MNEMONIC || '';
const ENV_TON_API_KEY_MAINNET = import.meta.env.VITE_TON_API_KEY_MAINNET || '';
const ENV_TON_API_KEY_TESTNET = import.meta.env.VITE_TON_API_KEY_TESTNET || '';

// UI Elements - will be initialized in init()
let screens: {
    seed: HTMLElement;
    network: HTMLElement;
    staking: HTMLElement;
};
let seedInput: HTMLTextAreaElement;
let restoreWalletBtn: HTMLButtonElement;
let seedError: HTMLElement;
let networkMainnetCard: HTMLElement;
let networkTestnetCard: HTMLElement;
let walletAddressMainnet: HTMLElement;
let walletAddressTestnet: HTMLElement;
let networkError: HTMLElement;
let deleteDataBtn: HTMLButtonElement;

const stakingError = document.getElementById('staking-error')!;

const balanceTon = document.getElementById('balance-ton')!;
const balanceAvailable = document.getElementById('balance-available')!;
const balanceStaked = document.getElementById('balance-staked')!;
const poolApy = document.getElementById('pool-apy')!;
const poolTvl = document.getElementById('pool-tvl')!;
const poolStakers = document.getElementById('pool-stakers')!;
const withdrawalsList = document.getElementById('withdrawals-list')!;
const roundsInfo = document.getElementById('rounds-info')!;

// State
let kit: TonWalletKit | null = null;
let wallet: Wallet | null = null;
let stakingManager: StakingManager | null = null;
let currentNetwork: 'mainnet' | 'testnet' = 'mainnet';
let jettonWalletAddress: Address | null = null;
let mainnetAddress: string = '';
let testnetAddress: string = '';

// Additional UI elements
let currentNetworkLabel: HTMLElement;
let currentWalletAddress: HTMLElement;
let changeNetworkBtn: HTMLButtonElement;
let txStatusEl: HTMLElement;
let txStatusIcon: HTMLElement;
let txStatusText: HTMLElement;
let txStatusDetails: HTMLElement;
let stakeBtn: HTMLButtonElement;
let stakeMaxBtn: HTMLButtonElement;
let unstakeBtn: HTMLButtonElement;
let unstakeInstantBtn: HTMLButtonElement;
let unstakeBestRateBtn: HTMLButtonElement;

let stakedBalanceNano = 0n;

// Initialize app
async function init() {
    console.log('Initializing app...');

    // Initialize DOM elements
    screens = {
        seed: document.getElementById('screen-seed')!,
        network: document.getElementById('screen-network')!,
        staking: document.getElementById('screen-staking')!,
    };

    seedInput = document.getElementById('seed-input') as HTMLTextAreaElement;
    restoreWalletBtn = document.getElementById('restore-wallet-btn') as HTMLButtonElement;
    seedError = document.getElementById('seed-error')!;
    networkMainnetCard = document.getElementById('network-mainnet')!;
    networkTestnetCard = document.getElementById('network-testnet')!;
    walletAddressMainnet = document.getElementById('wallet-address-mainnet')!;
    walletAddressTestnet = document.getElementById('wallet-address-testnet')!;
    networkError = document.getElementById('network-error')!;
    deleteDataBtn = document.getElementById('delete-data-btn') as HTMLButtonElement;

    // Validate critical elements
    if (!seedInput || !restoreWalletBtn || !seedError) {
        console.error('Critical DOM elements not found:', {
            seedInput: !!seedInput,
            restoreWalletBtn: !!restoreWalletBtn,
            seedError: !!seedError,
        });
        alert('Error: Required DOM elements not found. Please check the HTML file.');
        return;
    }

    console.log('DOM elements found, setting up event listeners...');

    // Check if wallet is already restored
    const savedSeed = localStorage.getItem(STORAGE_KEY_SEED);
    const savedNetwork = localStorage.getItem(STORAGE_KEY_NETWORK) as 'mainnet' | 'testnet' | null;

    if (savedSeed) {
        currentNetwork = savedNetwork || 'mainnet';
        await computeAddresses(savedSeed);
        showScreen('network');
    } else {
        showScreen('seed');
    }

    // Setup event listeners

    console.log('Adding click listener to restore button');
    restoreWalletBtn.addEventListener('click', (e) => {
        console.log('Restore button clicked!', e);
        handleRestoreWallet();
    });
    networkMainnetCard.addEventListener('click', () => selectNetworkAndContinue('mainnet'));
    networkTestnetCard.addEventListener('click', () => selectNetworkAndContinue('testnet'));
    deleteDataBtn.addEventListener('click', handleDeleteData);

    // Additional UI element references
    currentNetworkLabel = document.getElementById('current-network-label')!;
    currentWalletAddress = document.getElementById('current-wallet-address')!;
    changeNetworkBtn = document.getElementById('btn-change-network') as HTMLButtonElement;
    changeNetworkBtn.addEventListener('click', handleChangeNetwork);

    // Check for environment mnemonic - auto-restore if available
    const envMnemonic = ENV_WALLET_MNEMONIC;
    if (envMnemonic && !savedSeed) {
        console.log('Using mnemonic from environment variable');
        seedInput.value = envMnemonic;
        await handleRestoreWallet();
    }

    stakeBtn = document.getElementById('btn-stake') as HTMLButtonElement;
    stakeMaxBtn = document.getElementById('btn-stake-max') as HTMLButtonElement;
    txStatusEl = document.getElementById('tx-status')!;
    txStatusIcon = document.getElementById('tx-status-icon')!;
    txStatusText = document.getElementById('tx-status-text')!;
    txStatusDetails = document.getElementById('tx-status-details')!;

    // Staking operations
    stakeBtn.addEventListener('click', () => handleStake(toNano('1')));
    stakeMaxBtn.addEventListener('click', handleStakeMax);

    unstakeBtn = document.getElementById('btn-unstake')! as HTMLButtonElement;
    unstakeInstantBtn = document.getElementById('btn-unstake-instant')! as HTMLButtonElement;
    unstakeBestRateBtn = document.getElementById('btn-unstake-best-rate')! as HTMLButtonElement;

    unstakeBtn.addEventListener('click', () => {
        const amount = stakedBalanceNano < toNano('1') ? stakedBalanceNano : toNano('1');
        handleUnstake(amount, 'delayed');
    });
    unstakeInstantBtn.addEventListener('click', () => {
        const amount = stakedBalanceNano < toNano('1') ? stakedBalanceNano : toNano('1');
        handleUnstake(amount, 'instant');
    });
    unstakeBestRateBtn.addEventListener('click', () => {
        const amount = stakedBalanceNano < toNano('1') ? stakedBalanceNano : toNano('1');
        handleUnstake(amount, 'delayed', true);
    });
    document.getElementById('btn-refresh')!.addEventListener('click', handleRefreshBalances);
    document.getElementById('btn-get-rounds')!.addEventListener('click', handleGetRounds);
    // Initial button state
    updateUnstakeButtonsState();
}

function showScreen(screenName: 'seed' | 'network' | 'staking') {
    Object.values(screens).forEach((screen) => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showError(element: HTMLElement, message: string) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function formatBalance(nanoValue: string | bigint): string {
    const value = parseFloat(fromNano(nanoValue.toString()));
    return value.toFixed(2);
}

function showTxStatus(status: 'pending' | 'success' | 'error', text: string, details?: string) {
    txStatusEl.style.display = 'block';
    txStatusEl.className = 'tx-status ' + status;

    if (status === 'pending') {
        txStatusIcon.textContent = '⏳';
    } else if (status === 'success') {
        txStatusIcon.textContent = '✅';
    } else {
        txStatusIcon.textContent = '❌';
    }

    txStatusText.textContent = text;
    txStatusDetails.textContent = details || '';
}

function updateUnstakeButtonsState() {
    const disabled = stakedBalanceNano <= 0n;
    if (unstakeBtn) unstakeBtn.disabled = disabled;
    if (unstakeInstantBtn) unstakeInstantBtn.disabled = disabled;
    if (unstakeBestRateBtn) unstakeBestRateBtn.disabled = disabled;
}

function hideTxStatus() {
    txStatusEl.style.display = 'none';
}

async function handleRestoreWallet() {
    const seedPhrase = seedInput.value.trim();
    const words = seedPhrase.split(/\s+/).filter((w) => w.length > 0);

    console.log('handleRestoreWallet called', { wordsCount: words.length });

    if (words.length !== 12 && words.length !== 24) {
        showError(seedError, 'Seed phrase must contain 12 or 24 words');
        return;
    }

    try {
        restoreWalletBtn.disabled = true;
        restoreWalletBtn.textContent = 'Restoring...';

        console.log('Getting wallet kit...');
        const walletKit = getKit();

        console.log('Waiting for kit to be ready...');
        await walletKit.waitForReady();

        console.log('Kit is ready, creating signer...');

        const signer = await Signer.fromMnemonic(words, { type: 'ton' });

        console.log('Signer created, creating wallet adapter...');
        const network = Network.mainnet();
        const walletAdapter = await WalletV5R1Adapter.create(signer, {
            client: walletKit.getApiClient(network),
            network,
        });

        console.log('Wallet adapter created, adding wallet...');
        const addedWallet = await walletKit.addWallet(walletAdapter);
        if (!addedWallet) {
            throw new Error('Failed to create wallet');
        }
        wallet = addedWallet;

        const address = wallet.getAddress();

        console.log('Wallet created successfully:', address);

        localStorage.setItem(STORAGE_KEY_SEED, seedPhrase);
        localStorage.setItem(STORAGE_KEY_NETWORK, 'mainnet');

        await computeAddresses(seedPhrase);
        showScreen('network');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showError(seedError, `Error restoring wallet: ${errorMessage}`);
        // Log to console for debugging

        console.error('Wallet restoration error:', error);
    } finally {
        restoreWalletBtn.disabled = false;
        restoreWalletBtn.textContent = 'Restore Wallet';
    }
}

async function computeAddresses(seedPhrase: string) {
    const words = seedPhrase.split(/\s+/);
    const walletKit = getKit();
    await walletKit.waitForReady();

    const signer = await Signer.fromMnemonic(words, { type: 'ton' });

    // Create mainnet wallet and get address (bounceable format)
    const mainnetNetwork = Network.mainnet();
    const mainnetAdapter = await WalletV5R1Adapter.create(signer, {
        client: walletKit.getApiClient(mainnetNetwork),
        network: mainnetNetwork,
    });
    const mainnetRawAddress = mainnetAdapter.getAddress();
    mainnetAddress = Address.parse(mainnetRawAddress).toString({ bounceable: true, testOnly: false });

    // Create testnet wallet and get address (bounceable format)
    const testnetNetwork = Network.testnet();
    const testnetAdapter = await WalletV5R1Adapter.create(signer, {
        client: walletKit.getApiClient(testnetNetwork),
        network: testnetNetwork,
    });
    const testnetRawAddress = testnetAdapter.getAddress({ testnet: true });
    testnetAddress = Address.parse(testnetRawAddress).toString({ bounceable: true, testOnly: true });

    // Update UI
    walletAddressMainnet.textContent = mainnetAddress;
    walletAddressTestnet.textContent = testnetAddress;

    console.log('Addresses computed (bounceable):', { mainnetAddress, testnetAddress });
}

async function selectNetworkAndContinue(network: 'mainnet' | 'testnet') {
    currentNetwork = network;
    localStorage.setItem(STORAGE_KEY_NETWORK, network);
    localStorage.setItem(STORAGE_KEY_WALLET_ADDRESS, network === 'mainnet' ? mainnetAddress : testnetAddress);

    try {
        networkMainnetCard.style.opacity = '0.5';
        networkTestnetCard.style.opacity = '0.5';
        (network === 'mainnet' ? networkMainnetCard : networkTestnetCard).style.opacity = '1';

        await initializeStaking();

        // Update wallet info on staking screen
        updateWalletInfoDisplay();

        showScreen('staking');
        await handleRefreshBalances();
    } catch (error) {
        showError(networkError, `Initialization error: ${error instanceof Error ? error.message : String(error)}`);
        networkMainnetCard.style.opacity = '1';
        networkTestnetCard.style.opacity = '1';
    }
}

function updateWalletInfoDisplay() {
    currentNetworkLabel.textContent = currentNetwork === 'mainnet' ? 'Mainnet' : 'Testnet';
    currentWalletAddress.textContent = currentNetwork === 'mainnet' ? mainnetAddress : testnetAddress;
}

function handleChangeNetwork() {
    // Reset staking state and go back to network selection
    wallet = null;
    stakingManager = null;
    jettonWalletAddress = null;
    showScreen('network');
}

function handleDeleteData() {
    if (confirm('Are you sure you want to delete all wallet data?')) {
        localStorage.removeItem(STORAGE_KEY_SEED);
        localStorage.removeItem(STORAGE_KEY_NETWORK);
        localStorage.removeItem(STORAGE_KEY_WALLET_ADDRESS);
        if (kit) {
            kit.clearWallets();
        }
        kit = null;
        wallet = null;
        stakingManager = null;
        jettonWalletAddress = null;
        mainnetAddress = '';
        testnetAddress = '';
        seedInput.value = '';
        showScreen('seed');
    }
}

function getKit(): TonWalletKit {
    if (!kit) {
        kit = new TonWalletKit({
            deviceInfo: createDeviceInfo({
                platform: 'browser',
                appName: 'StakingDemo',
                appVersion: '1.0.0',
                maxProtocolVersion: 2,
                features: [
                    {
                        name: 'SendTransaction',
                        maxMessages: 4,
                        extraCurrencySupported: false,
                    },
                ],
            }),
            walletManifest: createWalletManifest({
                name: 'staking_demo',
                appName: 'Staking Demo',
                imageUrl: 'https://ton.org/download/ton_symbol.png',
                bridgeUrl: 'https://walletbot.me/tonconnect-bridge/bridge',
                universalLink: window.location.origin,
                aboutUrl: window.location.origin,
                platforms: ['chrome'],
            }),
            storage: new LocalStorageAdapter({ prefix: 'staking-demo:' }),
            networks: {
                [Network.mainnet().chainId]: {
                    apiClient: {
                        url: 'https://toncenter.com',
                        ...(ENV_TON_API_KEY_MAINNET && { apiKey: ENV_TON_API_KEY_MAINNET }),
                    },
                },
                [Network.testnet().chainId]: {
                    apiClient: {
                        url: 'https://testnet.toncenter.com',
                        ...(ENV_TON_API_KEY_TESTNET && { apiKey: ENV_TON_API_KEY_TESTNET }),
                    },
                },
            },
        });
    }
    return kit;
}

async function initializeStaking() {
    const savedSeed = localStorage.getItem(STORAGE_KEY_SEED);
    if (!savedSeed) {
        throw new Error('Seed phrase not found');
    }

    const walletKit = getKit();
    await walletKit.waitForReady();

    const words = savedSeed.split(/\s+/);
    const signer = await Signer.fromMnemonic(words, { type: 'ton' });
    const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();
    const walletAdapter = await WalletV5R1Adapter.create(signer, {
        client: walletKit.getApiClient(network),
        network,
    });

    const addedWallet = await walletKit.addWallet(walletAdapter);
    if (!addedWallet) {
        throw new Error('Failed to create wallet');
    }
    wallet = addedWallet;

    // Initialize StakingManager
    stakingManager = new StakingManager();

    // Register TonStakersStakingProvider
    const stakingProvider = new TonStakersStakingProvider(
        walletKit.getNetworkManager(),
        walletKit.getEventEmitter(),
        {},
    );
    stakingManager.registerProvider('tonstakers', stakingProvider);
    stakingManager.setDefaultProvider('tonstakers');

    // Get jetton wallet address
    await updateJettonWalletAddress();
}

async function updateJettonWalletAddress() {
    if (!wallet || !kit) return;

    try {
        const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();
        const contractAddress = getStakingContractAddress();
        const apiClient = kit.getApiClient(network);

        // Try to get jetton minter address from staking contract
        // The staking contract should have a method to get liquid_jetton_master
        // For now, we'll try to get it from get_pool_full_data or use a known address
        // Since we can't use tonapi.io, we'll use wallet.getJettonWalletAddress
        // which will call the jetton minter contract directly

        // Try to get jetton minter address from staking contract
        // First, try to get it from contract state
        await updateJettonWalletAddressFromContract(apiClient, contractAddress);

        // If that didn't work, try using stakingManager.getBalance which internally gets jetton wallet
        if (!jettonWalletAddress && stakingManager) {
            try {
                const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();
                await stakingManager.getBalance(wallet.getAddress(), network);
                // This will internally call getJettonWalletAddress, but we still need the address
                // So we'll try the contract approach again with a different method
            } catch {
                // Ignore
            }
        }
    } catch (error) {
        console.warn('Error updating jetton wallet address:', error);
        // Error handled silently - jetton wallet address will remain null
    }
}

async function updateJettonWalletAddressFromContract(apiClient: ApiClient, contractAddress: string) {
    if (!wallet) return;

    try {
        // Try to get jetton minter from contract using runGetMethod
        // This is contract-specific and may not work for all contracts
        const result = await apiClient.runGetMethod(contractAddress, 'get_pool_full_data');
        const parsedStack = ParseStack(result.stack);

        // Try to find address in stack items
        for (const item of parsedStack) {
            if (item.type === 'cell') {
                try {
                    const slice = item.cell.beginParse();
                    const addr = slice.loadMaybeAddress();
                    if (addr) {
                        const jettonWalletAddr = await wallet.getJettonWalletAddress(addr.toString());
                        jettonWalletAddress = Address.parse(jettonWalletAddr);
                        return;
                    }
                } catch {
                    // Continue searching
                }
            } else if (item.type === 'tuple' && item.items) {
                for (const tupleItem of item.items) {
                    if (tupleItem.type === 'cell') {
                        try {
                            const slice = tupleItem.cell.beginParse();
                            const addr = slice.loadMaybeAddress();
                            if (addr) {
                                const jettonWalletAddr = await wallet.getJettonWalletAddress(addr.toString());
                                jettonWalletAddress = Address.parse(jettonWalletAddr);
                                return;
                            }
                        } catch {
                            // Continue searching
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Failed to get jetton wallet address from contract:', error);
    }
}

function getStakingContractAddress(): string {
    return currentNetwork === 'mainnet' ? CONTRACT.STAKING_CONTRACT_ADDRESS : CONTRACT.STAKING_CONTRACT_ADDRESS_TESTNET;
}

async function handleStake(amount: bigint) {
    if (!wallet || !stakingManager) {
        showError(stakingError, 'Wallet not initialized');
        return;
    }

    // Disable buttons and show pending status
    stakeBtn.disabled = true;
    stakeMaxBtn.disabled = true;
    const originalText = stakeBtn.textContent;
    stakeBtn.textContent = 'Processing...';

    showTxStatus('pending', 'Creating transaction...', `Staking ${fromNano(amount)} TON`);

    try {
        const contractAddress = getStakingContractAddress();
        const totalAmount = amount + CONTRACT.STAKE_FEE_RES;

        console.log('Creating stake transaction:', {
            contractAddress,
            amount: fromNano(amount),
            totalAmount: fromNano(totalAmount),
        });

        const payload = beginCell()
            .storeUint(CONTRACT.PAYLOAD_STAKE, 32)
            .storeUint(1, 64)
            .storeUint(CONTRACT.PARTNER_CODE, 64)
            .endCell()
            .toBoc()
            .toString('base64') as Base64String;

        showTxStatus('pending', 'Building transaction...', `To: ${contractAddress}`);

        const transaction = await wallet.createTransferTonTransaction({
            recipientAddress: contractAddress,
            transferAmount: totalAmount.toString(),
            payload,
        });

        console.log('Transaction created:', transaction);
        showTxStatus('pending', 'Sending transaction...', 'Please wait...');

        await wallet.sendTransaction(transaction);

        showTxStatus(
            'success',
            'Transaction sent!',
            `Staked ${fromNano(amount)} TON successfully. Refreshing balances...`,
        );
        console.log('Transaction sent successfully');

        setTimeout(async () => {
            await handleRefreshBalances();
            setTimeout(() => hideTxStatus(), 3000);
        }, 5000);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Staking error:', error);
        showTxStatus('error', 'Transaction failed', errorMessage);
        showError(stakingError, `Staking error: ${errorMessage}`);
    } finally {
        stakeBtn.disabled = false;
        stakeMaxBtn.disabled = false;
        stakeBtn.textContent = originalText;
    }
}

async function handleStakeMax() {
    if (!wallet) {
        showError(stakingError, 'Wallet not initialized');
        return;
    }

    try {
        const balance = BigInt(await wallet.getBalance());
        const available = balance > CONTRACT.RECOMMENDED_FEE_RESERVE ? balance - CONTRACT.RECOMMENDED_FEE_RESERVE : 0n;
        if (available > 0n) {
            await handleStake(available);
        } else {
            showError(stakingError, 'Insufficient funds for staking');
        }
    } catch (error) {
        showError(stakingError, `Error getting balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function handleUnstake(amount: bigint, mode: 'instant' | 'delayed', waitTillRoundEnd = false) {
    if (stakedBalanceNano <= 0n) {
        showError(stakingError, 'No staked balance available to unstake');
        return;
    }

    if (amount > stakedBalanceNano) {
        showError(stakingError, `Insufficient staked balance. Available: ${fromNano(stakedBalanceNano)}`);
        return;
    }

    if (!wallet || !stakingManager) {
        showError(stakingError, 'Wallet or staking manager not initialized');
        return;
    }

    try {
        const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();

        let unstakeMode: 'instant' | 'delayed' | 'bestRate';
        if (mode === 'instant') {
            unstakeMode = 'instant';
        } else if (waitTillRoundEnd) {
            unstakeMode = 'bestRate';
        } else {
            unstakeMode = 'delayed';
        }

        showTxStatus('pending', 'Building unstake transaction...', `Mode: ${unstakeMode}`);

        const txRequest = await stakingManager.unstake({
            amount: amount.toString(),
            userAddress: wallet.getAddress(),
            network,
            unstakeMode,
        });

        showTxStatus('pending', 'Sending transaction...', 'Please wait...');

        if (txRequest.messages && txRequest.messages.length > 0) {
            const msg = txRequest.messages[0];
            const transaction = await wallet.createTransferTonTransaction({
                recipientAddress: msg.address,
                transferAmount: msg.amount,
                payload: msg.payload,
            });
            await wallet.sendTransaction(transaction);
        }

        showTxStatus('success', 'Unstaking transaction sent!', `Unstaked ${fromNano(amount)} tsTON`);
        setTimeout(async () => {
            await handleRefreshBalances();
            setTimeout(() => hideTxStatus(), 3000);
        }, 5000);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Unstaking error:', error);
        showTxStatus('error', 'Unstake failed', errorMessage);
        showError(stakingError, `Unstaking error: ${errorMessage}`);
    }
}

async function handleRefreshBalances() {
    if (!wallet) {
        console.warn('handleRefreshBalances: wallet not initialized');
        return;
    }

    console.log('Refreshing balances...');

    try {
        const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();

        // Get TON balance
        const tonBalance = await wallet.getBalance();
        console.log('TON balance:', fromNano(tonBalance));
        balanceTon.textContent = formatBalance(tonBalance);

        // Get available balance
        const available =
            BigInt(tonBalance) > CONTRACT.RECOMMENDED_FEE_RESERVE
                ? BigInt(tonBalance) - CONTRACT.RECOMMENDED_FEE_RESERVE
                : 0n;
        balanceAvailable.textContent = formatBalance(available);

        // Get staked balance via StakingManager (uses Toncenter, not TonAPI)
        if (stakingManager) {
            try {
                const stakingBalance = await stakingManager.getBalance(wallet.getAddress(), network);
                console.log('Staked balance from manager:', stakingBalance);
                stakedBalanceNano = BigInt(stakingBalance.stakedBalance);
                balanceStaked.textContent = formatBalance(stakingBalance.stakedBalance);
            } catch (err) {
                console.warn('Failed to get staked balance from manager:', err);
                stakedBalanceNano = 0n;
                balanceStaked.textContent = '0';
            }
        } else {
            stakedBalanceNano = 0n;
            balanceStaked.textContent = '0';
        }

        updateUnstakeButtonsState();

        // Get pool info using StakingManager
        await refreshPoolInfo();
    } catch (error) {
        console.error('Error in handleRefreshBalances:', error);
    }
}

async function refreshPoolInfo() {
    const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();

    console.log('Refreshing pool info via StakingManager');

    try {
        if (stakingManager) {
            try {
                const stakingInfo = await stakingManager.getStakingInfo(network);
                console.log('Staking info:', stakingInfo);
                poolApy.textContent = `${(stakingInfo.apy * 100).toFixed(2)}%`;

                // TVL is instant liquidity in this case
                if (stakingInfo.instantUnstakeAvailable) {
                    poolTvl.textContent = formatBalance(stakingInfo.instantUnstakeAvailable);
                }
            } catch (error) {
                console.warn('Failed to get staking info:', error);
                poolApy.textContent = '-';
                poolTvl.textContent = '-';
            }
        }

        // Note: Stakers count is not available via Toncenter API
        poolStakers.textContent = '-';
    } catch (error) {
        console.error('Error in refreshPoolInfo:', error);
    }
}

async function handleGetRounds() {
    console.log('Getting rounds info...');

    if (!stakingManager) {
        showError(stakingError, 'Staking manager not initialized');
        return;
    }

    try {
        const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();
        const provider = stakingManager.getProvider('tonstakers') as TonStakersStakingProvider;
        const roundInfo = await provider.getRoundInfo(network);

        console.log('Round info:', roundInfo);

        const startDate = new Date(roundInfo.cycle_start * 1000);
        const endDate = new Date(roundInfo.cycle_end * 1000);
        const now = new Date();
        const remaining = endDate.getTime() - now.getTime();
        const hoursRemaining = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
        const minutesRemaining = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

        roundsInfo.innerHTML = `
            <div><strong>Current Round (Estimated)</strong></div>
            <div>Start: ${startDate.toLocaleString()}</div>
            <div>End: ${endDate.toLocaleString()}</div>
            <div>Remaining: ${hoursRemaining}h ${minutesRemaining}m</div>
            ${roundInfo.cycle_length ? `<div>Cycle Length: ${Math.floor(roundInfo.cycle_length / 3600)}h</div>` : ''}
        `;
    } catch (error) {
        console.error('Error getting rounds info:', error);
        showError(stakingError, `Error getting rounds info: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function _handleGetWithdrawals() {
    if (!wallet) {
        showError(stakingError, 'Wallet not initialized');
        return;
    }

    try {
        // Fetch withdrawal payouts
        const response = await fetch('https://api.tonstakers.com/api/v1/pool/withdrawal_payout');
        const data = await response.json();
        const activeCollections = data.data?.active_collections || [];

        if (activeCollections.length === 0) {
            withdrawalsList.innerHTML = '<p>No active withdrawals</p>';
            return;
        }

        const userAddress = wallet.getAddress();
        let hasWithdrawals = false;

        withdrawalsList.innerHTML = '';

        for (const collection of activeCollections) {
            try {
                if (!kit) continue;

                const network = currentNetwork === 'mainnet' ? Network.mainnet() : Network.testnet();
                const apiClient = kit.getApiClient(network);

                // Use apiClient to get NFT items by owner
                const nftData = await apiClient.nftItemsByOwner({
                    ownerAddress: userAddress,
                    collectionAddress: collection.withdrawal_payout,
                    limit: 100,
                    offset: 0,
                });

                interface NftItem {
                    owner?: { address?: string };
                    metadata?: { name?: string };
                }

                const userNfts = (nftData.nft_items as NftItem[] | undefined) || [];

                for (const nft of userNfts) {
                    hasWithdrawals = true;
                    const withdrawalDiv = document.createElement('div');
                    withdrawalDiv.className = 'withdrawal-item';
                    const tsTONAmount = nft.metadata?.name?.match(/[\d.]+/)?.[0] || '0';
                    withdrawalDiv.innerHTML = `
                        <strong>Withdrawal ${tsTONAmount} tsTON</strong><br>
                        <span>Collection: ${collection.withdrawal_payout}</span><br>
                        <span>Round ends: ${new Date(collection.cycle_end * 1000).toLocaleString()}</span>
                    `;
                    withdrawalsList.appendChild(withdrawalDiv);
                }
            } catch (error) {
                console.warn('Error fetching withdrawal NFTs:', error);
                // Error handled silently - withdrawal will be skipped
            }
        }

        if (!hasWithdrawals) {
            withdrawalsList.innerHTML = '<p>No active withdrawals</p>';
        }
    } catch (error) {
        showError(
            stakingError,
            `Error getting withdrawals list: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
