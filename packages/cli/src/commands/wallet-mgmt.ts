/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createInterface } from 'node:readline/promises';

import { saveConfig, deleteConfig, loadConfig, getConfigPath, configExists } from '../utils/config.js';
import { header, keyValue, printResult, printError, successHeader, dim } from '../utils/output.js';

export async function walletShowCommand(jsonMode: boolean): Promise<void> {
    const config = loadConfig();

    if (!config) {
        printError(jsonMode, 'No wallet configured.', 'Run "ton setup" to configure your wallet.');
        return;
    }

    const maskedMnemonic = config.mnemonic ? config.mnemonic.split(' ').slice(0, 3).join(' ') + ' ...' : undefined;

    const maskedKey = config.private_key ? config.private_key.slice(0, 10) + '...' : undefined;

    const data = {
        success: true,
        configured: true,
        configPath: getConfigPath(),
        network: config.network || 'mainnet',
        walletVersion: config.wallet_version || 'v5r1',
        hasMnemonic: !!config.mnemonic,
        hasPrivateKey: !!config.private_key,
        hasToncenterKey: !!config.toncenter_api_key,
    };

    const human =
        header('Wallet Configuration') +
        keyValue([
            ['Config file', getConfigPath()],
            ['Mnemonic', maskedMnemonic],
            ['Private key', maskedKey],
            ['Network', config.network || 'mainnet'],
            ['Wallet version', config.wallet_version || 'v5r1'],
            ['Toncenter key', config.toncenter_api_key ? 'configured' : undefined],
        ]);

    printResult(jsonMode, data, human);
}

export async function walletImportCommand(
    mnemonic: string | undefined,
    privateKey: string | undefined,
    network: string | undefined,
    walletVersion: string | undefined,
    jsonMode: boolean,
): Promise<void> {
    if (!mnemonic && !privateKey) {
        printError(
            jsonMode,
            'Provide --mnemonic or --private-key to import.',
            'Example: ton wallet import --mnemonic "word1 word2 ... word24"',
        );
        return;
    }

    if (mnemonic) {
        const words = mnemonic.trim().split(/\s+/);
        if (words.length !== 24) {
            printError(jsonMode, `Invalid mnemonic: expected 24 words, got ${words.length}`);
            return;
        }
    }

    const existing = loadConfig() || {};

    saveConfig({
        ...existing,
        ...(mnemonic ? { mnemonic: mnemonic.trim() } : {}),
        ...(privateKey ? { private_key: privateKey.trim() } : {}),
        ...(network ? { network: network as 'mainnet' | 'testnet' } : {}),
        ...(walletVersion ? { wallet_version: walletVersion as 'v5r1' | 'v4r2' } : {}),
    });

    const data = { success: true, message: 'Wallet imported successfully.', configPath: getConfigPath() };
    const human = successHeader('Wallet imported successfully.') + `  ${dim('Config saved to:')} ${getConfigPath()}`;

    printResult(jsonMode, data, human);
}

export async function walletResetCommand(force: boolean, jsonMode: boolean): Promise<void> {
    if (!configExists()) {
        printError(jsonMode, 'No config to reset.', `Expected at: ${getConfigPath()}`);
        return;
    }

    if (!force && !jsonMode) {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        try {
            const answer = await rl.question(`  Delete ${getConfigPath()}? (y/N): `);
            if (answer.trim().toLowerCase() !== 'y') {
                process.stderr.write('  Cancelled.\n');
                return;
            }
        } finally {
            rl.close();
        }
    }

    const deleted = deleteConfig();

    if (deleted) {
        const data = { success: true, message: 'Config deleted.' };
        const human = successHeader('Config deleted.') + `  ${dim(getConfigPath())}`;
        printResult(jsonMode, data, human);
    } else {
        printError(jsonMode, 'Failed to delete config.');
    }
}
