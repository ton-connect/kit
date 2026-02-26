/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, tableRows, printResult, printError, dim } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

const KNOWN_JETTONS = [
    { symbol: 'USD₮', name: 'Tether USD', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 },
    { symbol: 'NOT', name: 'Notcoin', address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT', decimals: 9 },
    { symbol: 'DOGS', name: 'Dogs', address: 'EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS', decimals: 9 },
    { symbol: 'DUST', name: 'DeDust', address: 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE', decimals: 9 },
    { symbol: 'GRAM', name: 'Gram', address: 'EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O', decimals: 9 },
] as const;

export { KNOWN_JETTONS };

export async function jettonsCommand(service: CliWalletService, jsonMode: boolean): Promise<void> {
    try {
        const jettons = await withSpinner('Fetching tokens...', () => service.getJettons());

        const data = { success: true, jettons, count: jettons.length };

        if (jsonMode) {
            printResult(true, data, '');
            return;
        }

        let human = header(`Tokens (${jettons.length})`);
        if (jettons.length > 0) {
            const rows = jettons.map((j) => [j.symbol || '???', j.balance, dim(j.address)]);
            human += tableRows([[dim('Symbol'), dim('Balance'), dim('Address')], ...rows]);
        } else {
            human += '  No tokens found.';
        }

        printResult(false, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export function knownJettonsCommand(jsonMode: boolean): void {
    const data = { success: true, jettons: KNOWN_JETTONS, count: KNOWN_JETTONS.length };

    if (jsonMode) {
        printResult(true, data, '');
        return;
    }

    let human = header(`Known Jettons (${KNOWN_JETTONS.length})`);
    const rows = KNOWN_JETTONS.map((j) => [j.symbol, j.name, dim(j.address), String(j.decimals)]);
    human += tableRows([[dim('Symbol'), dim('Name'), dim('Address'), dim('Decimals')], ...rows]);

    printResult(false, data, human);
}
