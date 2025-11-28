/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * npx tsx examples/walletkit-close.ts
 *
 * Example script that demonstrates:
 * 1. Creating a WalletKit instance
 * 2. Waiting for it to be ready
 * 3. Properly closing it
 * 4. Exiting the process
 */
import 'dotenv/config';
import { TonWalletKit } from '../src';

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

let kit: TonWalletKit | undefined;

async function main() {
    logInfo('=== WalletKit Close Test ===');
    logInfo('Step 1: Creating WalletKit instance...');
    kit = new TonWalletKit({
        bridge: {
            enableJsBridge: false,
        },
        eventProcessor: {
            disableEvents: true, // Disable event processing for this test
        },
        storage: {
            allowMemory: true, // Use memory storage for Node.js environment
        },
    });
    logInfo('✓ WalletKit instance created\n');

    logInfo('Step 2: Waiting for WalletKit to be ready...');
    await kit.waitForReady();
    logInfo('✓ WalletKit is ready');
    logInfo(`Status: ${JSON.stringify(kit.getStatus())}`);
    logInfo(`Network: ${kit.getNetwork()}\n`);

    logInfo('Step 3: Closing WalletKit...');
    await kit.close();
    logInfo('✓ WalletKit closed successfully');
    logInfo(`Status after close: ${JSON.stringify(kit.getStatus())}\n`);

    logInfo('Step 4: Exiting process...');
    logInfo('✓ Test completed successfully');
}

main().catch((error) => {
    if (error instanceof Error) {
        logError(error.message);
        logError(error.stack);
    } else {
        logError('Unknown error:', error);
    }
    process.exit(1);
});
