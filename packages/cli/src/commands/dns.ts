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

export async function dnsResolveCommand(service: CliWalletService, domain: string, jsonMode: boolean): Promise<void> {
    try {
        const address = await withSpinner(`Resolving ${domain}...`, () => service.resolveDns(domain));

        if (!address) {
            printError(
                jsonMode,
                `Could not resolve domain "${domain}".`,
                'The domain may not exist or may not have a wallet record.',
            );
            return;
        }

        const data = { success: true, domain, address };
        const human =
            header('DNS Resolved') +
            keyValue([
                ['Domain', domain],
                ['Address', address],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function dnsReverseCommand(service: CliWalletService, address: string, jsonMode: boolean): Promise<void> {
    try {
        const domain = await withSpinner(`Reverse resolving ${address}...`, () => service.backResolveDns(address));

        const data = {
            success: true,
            address,
            domain: domain || null,
            ...(domain ? {} : { message: 'No DNS domain found for this address.' }),
        };

        if (jsonMode) {
            printResult(true, data, '');
            return;
        }

        if (!domain) {
            const human =
                header('DNS Reverse Lookup') +
                keyValue([
                    ['Address', address],
                    ['Domain', 'Not found'],
                ]);
            printResult(false, data, human);
        } else {
            const human =
                header('DNS Reverse Lookup') +
                keyValue([
                    ['Address', address],
                    ['Domain', domain],
                ]);
            printResult(false, data, human);
        }
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
