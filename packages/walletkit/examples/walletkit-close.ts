/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Example script that demonstrates:
 * 1. Creating a WalletKit instance
 * 2. Waiting for it to be ready
 * 3. Properly closing it
 * 4. Exiting the process
 */
import * as dotenv from 'dotenv';

import { TonWalletKit } from '../src';

dotenv.config();

// eslint-disable-next-line no-console
const logInfo = console.log;
// eslint-disable-next-line no-console
const logError = console.error;

let kit: TonWalletKit | undefined;

// Handle termination signals
// const cleanup = async (exitCode: number = 0) => {
//     if (kit) {
//         logInfo('\nReceived termination signal, closing WalletKit...');
//         try {
//             await kit.close();
//             logInfo('✓ WalletKit closed successfully');
//         } catch (error) {
//             logError('Error closing WalletKit:', error);
//         }
//     }
//     process.exit(exitCode);
// };

// process.on('SIGTERM', () => cleanup(33));
// process.on('SIGINT', () => cleanup(33));

async function main() {
    logInfo('=== WalletKit Close Test ===\n');

    // 1. Create WalletKit instance
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

    // 2. Wait for the kit to be ready
    logInfo('Step 2: Waiting for WalletKit to be ready...');
    await kit.waitForReady();
    logInfo('✓ WalletKit is ready');
    logInfo(`Status: ${JSON.stringify(kit.getStatus())}`);
    logInfo(`Network: ${kit.getNetwork()}\n`);

    // 3. Close the WalletKit instance
    logInfo('Step 3: Closing WalletKit...');
    await kit.close();
    logInfo('✓ WalletKit closed successfully');
    logInfo(`Status after close: ${JSON.stringify(kit.getStatus())}\n`);

    // 4. Exit
    logInfo('Step 4: Exiting process...');
    logInfo('✓ Test completed successfully');
}

main()
    .then(() => {
        logInfo('\n=== All steps completed ===');
    })
    .catch((error) => {
        logError('\n=== Error occurred ===');
        if (error instanceof Error) {
            logError('Message:', error.message);
            logError('Stack:', error.stack);
        } else {
            logError('Unknown error:', error);
        }
        process.exit(1);
    });
