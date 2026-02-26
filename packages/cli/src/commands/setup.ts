/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createInterface } from 'node:readline/promises';

import { CreateTonMnemonic } from '@ton/walletkit';

import { printLogo } from '../utils/logo.js';
import { saveConfig, getConfigPath, configExists, loadConfig } from '../utils/config.js';
import { printError, dim, bold, green, yellow, symbols } from '../utils/output.js';

type RL = ReturnType<typeof createInterface>;

const TOTAL_STEPS = 3;

function stepHeader(n: number, label: string): void {
    process.stderr.write(`\n  [${n}/${TOTAL_STEPS}] ${bold(label)}\n`);
    process.stderr.write(`  ${'─'.repeat(label.length + 6)}\n`);
}

async function prompt(rl: RL, question: string): Promise<string> {
    const answer = await rl.question(`  ${question}: `);
    return answer.trim();
}

async function promptYN(rl: RL, question: string, defaultYes: boolean): Promise<boolean> {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    const answer = await rl.question(`  ${question} [${hint}] `);
    const trimmed = answer.trim().toLowerCase();
    if (!trimmed) return defaultYes;
    return trimmed === 'y' || trimmed === 'yes';
}

async function promptChoice(rl: RL, question: string, choices: string[], defaultValue: string): Promise<string> {
    const formatted = choices.map((c) => (c === defaultValue ? green(c) : c)).join(' / ');
    const answer = await rl.question(`  ${question} [${formatted}]: `);
    const trimmed = answer.trim().toLowerCase();
    if (!trimmed) return defaultValue;
    const match = choices.find((c) => c.toLowerCase() === trimmed);
    return match || defaultValue;
}

async function setupWallet(rl: RL): Promise<string[] | null> {
    const hasMnemonic = await promptYN(rl, 'Do you have an existing mnemonic?', false);

    if (hasMnemonic) {
        const input = await prompt(rl, 'Enter mnemonic (24 words)');
        if (!input) {
            process.stderr.write(`  ${symbols.error} Mnemonic is required.\n`);
            return null;
        }
        const words = input.split(/\s+/);
        if (words.length !== 24) {
            process.stderr.write(`  ${symbols.error} Invalid mnemonic: expected 24 words, got ${words.length}\n`);
            return null;
        }
        process.stderr.write(`  ${symbols.success} Mnemonic accepted\n`);
        return words;
    }

    process.stderr.write(`  ${dim('Generating new wallet...')}\n`);
    const words = await CreateTonMnemonic();

    process.stderr.write(`  ${symbols.success} Wallet created\n\n`);
    process.stderr.write(`  ${bold('Mnemonic (save this — it cannot be recovered):')}\n\n`);
    process.stderr.write(`  ${words.join(' ')}\n\n`);
    process.stderr.write(
        `  ${yellow(`${symbols.warning} Back up these 24 words. If lost, your funds cannot be recovered.`)}\n`,
    );

    return words;
}

export async function setupCommand(jsonMode: boolean): Promise<void> {
    if (jsonMode) {
        printError(true, 'Setup wizard is interactive-only. Remove --json flag.');
        return;
    }

    printLogo();
    process.stderr.write(` ${dim("Welcome! Let's configure your wallet.")}\n`);

    const rl = createInterface({
        input: process.stdin,
        output: process.stderr,
    });

    try {
        // ── Step 1: Wallet ──────────────────────────────────
        stepHeader(1, 'Wallet');

        if (configExists()) {
            const existing = loadConfig();
            const source = existing?.mnemonic ? 'mnemonic' : existing?.private_key ? 'private key' : 'unknown';
            process.stderr.write(`  ${symbols.success} Wallet already configured (${source})\n`);
            process.stderr.write(`  ${dim('Config:')} ${getConfigPath()}\n\n`);

            const reconfigure = await promptYN(rl, 'Reconfigure wallet?', false);
            if (!reconfigure) {
                finishSetup();
                return;
            }
            process.stderr.write('\n');
        }

        const words = await setupWallet(rl);
        if (!words) return;

        // ── Step 2: Network ─────────────────────────────────
        stepHeader(2, 'Network');

        const network = await promptChoice(rl, 'Network', ['mainnet', 'testnet'], 'mainnet');
        const walletVersion = await promptChoice(rl, 'Wallet version', ['v5r1', 'v4r2'], 'v5r1');
        const toncenterApiKey = await prompt(rl, 'Toncenter API key (optional, Enter to skip)');

        process.stderr.write(`  ${symbols.success} Network configured\n`);

        // ── Step 3: Save ────────────────────────────────────
        stepHeader(3, 'Save');

        saveConfig({
            mnemonic: words.join(' '),
            network: network as 'mainnet' | 'testnet',
            wallet_version: walletVersion as 'v5r1' | 'v4r2',
            ...(toncenterApiKey ? { toncenter_api_key: toncenterApiKey } : {}),
        });

        process.stderr.write(`  ${symbols.success} Config saved to ${getConfigPath()}\n`);
        process.stderr.write(`  ${dim('Network:')} ${network}\n`);
        process.stderr.write(`  ${dim('Wallet:')} ${walletVersion}\n`);

        finishSetup();
    } finally {
        rl.close();
    }
}

function finishSetup(): void {
    process.stderr.write('\n  ────────────────────────────────────\n');
    process.stderr.write(`  ${symbols.success} ${green(bold("Setup complete! You're ready to go."))}\n`);
    process.stderr.write('\n');
    process.stderr.write(`  ${bold('Next steps:')}\n`);
    process.stderr.write(`    ton wallet              ${dim('View wallet info')}\n`);
    process.stderr.write(`    ton balance             ${dim('Check TON balance')}\n`);
    process.stderr.write(`    ton shell               ${dim('Interactive mode')}\n`);
    process.stderr.write(`    ton markets list        ${dim('Browse markets')}\n`);
    process.stderr.write('\n');
}
