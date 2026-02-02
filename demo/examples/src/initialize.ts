/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'dotenv/config';
import { walletKitInitializeSample } from './lib/walletKitInitializeSample';

/**
 * npx tsx src/initialize.ts
 *
 * Example script that demonstrates:
 * 1. Creating a WalletKit instance
 * 2. Waiting for it to be ready
 * 3. Add wallet V5R1
 * 4. Properly closing it
 * 5. Exiting the process
 */

export async function main() {
    const kit = await walletKitInitializeSample();
    console.log('Step 3: Closing WalletKit...');
    await kit.close();
    console.log('✓ WalletKit closed successfully');
    console.log(`Status after close: ${JSON.stringify(kit.getStatus())}`);

    console.log('Step 5: Exiting process...');
    console.log('✓ WalletKit Initialize completed successfully');
}

/* istanbul ignore next */
if (process.env.VITEST !== 'true') {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
