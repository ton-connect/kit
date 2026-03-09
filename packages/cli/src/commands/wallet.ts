/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, keyValue, printResult, printError } from '../utils/output.js';

export async function walletCommand(service: CliWalletService, jsonMode: boolean): Promise<void> {
    try {
        const address = service.getAddress();
        const network = service.getNetwork();

        const data = { success: true, address, network };
        const human =
            header('Wallet Info') +
            keyValue([
                ['Address', address],
                ['Network', network],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
