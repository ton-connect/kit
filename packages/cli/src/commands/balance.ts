/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, keyValue, printResult, printError } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

export async function balanceCommand(service: CliWalletService, jsonMode: boolean): Promise<void> {
    try {
        const balance = await withSpinner('Fetching balance...', () => service.getBalance());
        const balanceTon = Number(BigInt(balance)) / 1e9;

        const data = {
            success: true,
            address: service.getAddress(),
            balance: `${balanceTon} TON`,
            balanceNano: balance,
        };

        const human = header('Balance') + keyValue([['TON', `${balanceTon} TON (${balance} nanoTON)`]]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function jettonBalanceCommand(
    service: CliWalletService,
    jettonAddress: string,
    jsonMode: boolean,
): Promise<void> {
    try {
        const balance = await withSpinner('Fetching jetton balance...', () => service.getJettonBalance(jettonAddress));

        const data = { success: true, jettonAddress, balance };
        const human =
            header('Jetton Balance') +
            keyValue([
                ['Jetton', jettonAddress],
                ['Balance', balance],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
