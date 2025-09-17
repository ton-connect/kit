import util from 'util';

// import { Address } from '@ton/core'; // Not used in this example
import * as dotenv from 'dotenv';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';

import {
    ApiClientToncenter,
    createWalletInitConfigLedger,
    createLedgerPath,
    ConnectTransactionParamMessage,
    WalletInterface,
    CHAIN,
} from '../src';
import { wrapWalletInterface } from '../src/core/Initializer';
import { createWalletV4R2Ledger } from '../src/contracts/v4/WalletV4R2LedgerAdapter';

dotenv.config();

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

const isTestSend = process.env.TEST_SEND;
const apiKey = process.env.TONCENTER_API_KEY;

const endpoint = 'https://toncenter.com';
const tonClient = new ApiClientToncenter({
    endpoint,
    apiKey,
});

async function createLedgerWallet(
    testnet: boolean = false,
    workchain: number = 0,
    account: number = 0,
): Promise<WalletInterface> {
    logInfo('🔌 Connecting to Ledger device...');

    try {
        // Connect to Ledger device using Node.js HID transport
        const transport = await TransportNodeHid.create();

        // Create derivation path for mainnet, workchain 0, account 0
        const path = createLedgerPath(testnet, workchain, account);

        logInfo('📱 Ledger device connected, derivation path:', path);

        // Create Ledger wallet configuration
        const ledgerConfig = createWalletInitConfigLedger({
            transport,
            path,
            version: 'v4r2', // Only v4r2 is supported for Ledger
            network: CHAIN.MAINNET,
            workchain: 0,
            accountIndex: 0,
        });

        // Create Ledger wallet
        const wallet = await createWalletV4R2Ledger(ledgerConfig, { tonClient });

        return wrapWalletInterface(wallet, tonClient);
    } catch (error) {
        logError('❌ Failed to connect to Ledger device:', error);
        throw error;
    }
}

async function logWallet(wallet: WalletInterface) {
    const address = wallet.getAddress();
    logInfo('📍 Wallet address:', address);

    try {
        const balance = await wallet.getBalance();
        logInfo('💰 Balance:', balance, 'nanoTON');

        const nfts = await wallet.getNfts({});
        logInfo('🖼️  NFTs count:', nfts.items.length);

        return {
            address,
            balance,
            nftsCount: nfts.items.length,
        };
    } catch (error) {
        logError('⚠️  Error fetching wallet data:', error);
        return {
            address,
            balance: 'Error',
            nftsCount: 0,
        };
    }
}

async function testLedgerWallet() {
    try {
        logInfo('🚀 Starting Ledger wallet test...');
        logInfo('⚠️  Make sure your Ledger device is connected and the TON app is open!');

        // Create Ledger wallet
        const ledgerWallet = await createLedgerWallet(false, 0, 1);

        // for (let i = 0; i < 10; i++) {
        //     const ledgerWallet = await createLedgerWallet(false, 0, i);
        //     // const walletInfo = await logWallet(ledgerWallet);
        //     logInfo(`📊 Wallet info ${i}:`, ledgerWallet.getAddress());
        // }

        // Log wallet information
        const walletInfo = await logWallet(ledgerWallet);
        logInfo('📊 Wallet info:', util.inspect(walletInfo, { colors: true, depth: 3 }));

        // Create a test transaction message
        const message: ConnectTransactionParamMessage = {
            address: ledgerWallet.getAddress(),
            amount: '1000000', // 0.001 TON in nanoTON
        };

        logInfo('🧮 Simulating transaction...');

        // Test transaction emulation
        // const emulation = await tonClient.fetchEmulation(ledgerWallet.getAddress(), [message]);
        // const totalFees = Object.values(emulation.transactions)
        //     .map((tx) => tx.total_fees)
        //     .reduce((acc, fee) => acc + +fee, 0);

        // logInfo('💸 Emulation total fees:', totalFees, 'nanoTON');

        if (isTestSend) {
            logInfo('📝 Creating transaction for signing...');
            logInfo('⚠️  Please confirm the transaction on your Ledger device!');

            try {
                const boc = await ledgerWallet.getSignedSendTransaction(
                    {
                        network: CHAIN.MAINNET,
                        valid_until: Math.floor(Date.now() / 1000) + 60,
                        messages: [message],
                    },
                    { fakeSignature: false },
                );

                logInfo('✅ Transaction signed successfully!');

                // Send the transaction
                const hash = await tonClient.sendBoc(boc);
                logInfo('📤 Transaction sent! Hash:', hash);
            } catch (signError) {
                if (signError.message?.includes('rejected') || signError.message?.includes('denied')) {
                    logError('❌ Transaction rejected by user on Ledger device');
                } else {
                    logError('❌ Error signing transaction:', signError);
                }
                throw signError;
            }
        } else {
            logInfo('ℹ️  Set TEST_SEND=true environment variable to actually send a transaction');
            logInfo('✅ Ledger wallet test completed successfully (dry run)');
        }
    } catch (error) {
        if (error.message?.includes('No device selected')) {
            logError('❌ No Ledger device found. Please connect your Ledger device and try again.');
        } else if (error.message?.includes('App does not seem to be open')) {
            logError('❌ TON app is not open on Ledger device. Please open the TON app and try again.');
        } else {
            logError('❌ Ledger wallet test failed:', error);
        }
        throw error;
    }
}

async function main() {
    try {
        await testLedgerWallet();
    } catch (error) {
        if (error instanceof Error) {
            logError('💥 Test failed:', error.message);
            if (error.stack) {
                logError('📋 Stack trace:', error.stack);
            }
        } else {
            logError('💥 Unknown error:', error);
        }
        process.exit(1);
    }
}

// Instructions for running the test
logInfo('📋 Ledger Test Instructions:');
logInfo('1. Connect your Ledger device via USB');
logInfo('2. Unlock the device with your PIN');
logInfo('3. Open the TON application on your Ledger device');
logInfo('4. Run this script');
logInfo('5. Optionally set TEST_SEND=true to actually send a transaction');
logInfo('6. Set TONCENTER_API_KEY for better API limits');
logInfo('');

main();
