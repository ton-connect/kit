/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createInterface } from 'readline';

import type { CliWalletService } from '../services/CliWalletService.js';
import { printLogo } from '../utils/logo.js';
import { dim, yellow, symbols } from '../utils/output.js';
import { walletCommand } from './wallet.js';
import { balanceCommand, jettonBalanceCommand } from './balance.js';
import { transactionsCommand } from './transactions.js';
import { jettonsCommand, knownJettonsCommand } from './jettons.js';
import { dnsResolveCommand, dnsReverseCommand } from './dns.js';
import { nftListCommand, nftGetCommand, nftSendCommand } from './nft.js';
import { sendTonCommand, sendJettonCommand, sendRawCommand } from './send.js';
import { swapQuoteCommand } from './swap.js';

function shellHint(usage: string[]): void {
    process.stderr.write(`  ${yellow(symbols.warning)} Usage:\n`);
    for (const line of usage) {
        process.stderr.write(`    ${dim(line)}\n`);
    }
}

function shellError(message: string): void {
    process.stderr.write(`  ${symbols.error} ${message}\n`);
}

function printShellHelp(): void {
    process.stderr.write(dim('  Commands:\n'));
    process.stderr.write(dim('    wallet                           Show wallet info\n'));
    process.stderr.write(dim('    balance                          Get TON balance\n'));
    process.stderr.write(dim('    balance jetton <addr>            Get jetton balance\n'));
    process.stderr.write(dim('    jettons                          List all tokens\n'));
    process.stderr.write(dim('    jettons known                    List popular tokens\n'));
    process.stderr.write(dim('    transactions [--limit N]         Transaction history\n'));
    process.stderr.write(dim('    send ton <to> <amount>           Send TON\n'));
    process.stderr.write(dim('    send jetton <to> <jetton> <amt>  Send jetton\n'));
    process.stderr.write(dim('    send raw --messages <json>       Send raw transaction\n'));
    process.stderr.write(dim('    swap quote <from> <to> <amount>  Get swap quote\n'));
    process.stderr.write(dim('    nft list                         List NFTs\n'));
    process.stderr.write(dim('    nft get <addr>                   Get NFT details\n'));
    process.stderr.write(dim('    nft send <nft> <to>              Send NFT\n'));
    process.stderr.write(dim('    dns resolve <domain>             Resolve .ton domain\n'));
    process.stderr.write(dim('    dns reverse <address>            Reverse DNS lookup\n'));
    process.stderr.write(dim('    help                             Show this help\n'));
    process.stderr.write(dim('    exit                             Exit shell\n'));
    process.stderr.write('\n');
}

async function executeShellCommand(service: CliWalletService, input: string): Promise<boolean> {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
        case 'wallet':
            await walletCommand(service, false);
            break;

        case 'balance':
            if (args[0] === 'jetton' && args[1]) {
                await jettonBalanceCommand(service, args[1], false);
            } else if (args[0] === 'jetton') {
                shellHint(['balance jetton <jetton-address>']);
            } else {
                await balanceCommand(service, false);
            }
            break;

        case 'jettons':
            if (args[0] === 'known') {
                knownJettonsCommand(false);
            } else {
                await jettonsCommand(service, false);
            }
            break;

        case 'transactions': {
            const limitIdx = args.indexOf('--limit');
            const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : 20;
            await transactionsCommand(service, limit, false);
            break;
        }

        case 'send':
            if (args[0] === 'ton' && args[1] && args[2]) {
                const commentIdx = args.indexOf('--comment');
                const comment = commentIdx !== -1 ? args.slice(commentIdx + 1).join(' ') : undefined;
                await sendTonCommand(service, args[1], args[2], comment, false);
            } else if (args[0] === 'jetton' && args[1] && args[2] && args[3]) {
                const commentIdx = args.indexOf('--comment');
                const comment = commentIdx !== -1 ? args.slice(commentIdx + 1).join(' ') : undefined;
                await sendJettonCommand(service, args[1], args[2], args[3], comment, false);
            } else if (args[0] === 'raw') {
                const msgIdx = args.indexOf('--messages');
                const messagesJson = msgIdx !== -1 ? args.slice(msgIdx + 1).join(' ') : '';
                if (messagesJson) {
                    await sendRawCommand(service, messagesJson, false);
                } else {
                    shellHint(['send raw --messages \'[{"address":"...","amount":"..."}]\'']);
                }
            } else if (args[0] === 'ton') {
                shellHint(['send ton <to-address> <amount>']);
            } else if (args[0] === 'jetton') {
                shellHint(['send jetton <to-address> <jetton-address> <amount>']);
            } else {
                shellHint([
                    'send ton <to> <amount>             Send TON',
                    'send jetton <to> <jetton> <amount> Send jetton',
                    'send raw --messages <json>          Send raw transaction',
                ]);
            }
            break;

        case 'swap':
            if (args[0] === 'quote' && args[1] && args[2] && args[3]) {
                const slippageIdx = args.indexOf('--slippage');
                const slippage =
                    slippageIdx !== -1 && args[slippageIdx + 1] ? parseInt(args[slippageIdx + 1], 10) : undefined;
                await swapQuoteCommand(service, args[1], args[2], args[3], slippage, false);
            } else {
                shellHint(['swap quote <from-token> <to-token> <amount>']);
            }
            break;

        case 'nft':
            if (args[0] === 'list') {
                const limitIdx = args.indexOf('--limit');
                const limit = limitIdx !== -1 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : 20;
                const offsetIdx = args.indexOf('--offset');
                const offset = offsetIdx !== -1 && args[offsetIdx + 1] ? parseInt(args[offsetIdx + 1], 10) : 0;
                await nftListCommand(service, limit, offset, false);
            } else if (args[0] === 'get' && args[1]) {
                await nftGetCommand(service, args[1], false);
            } else if (args[0] === 'send' && args[1] && args[2]) {
                const commentIdx = args.indexOf('--comment');
                const comment = commentIdx !== -1 ? args.slice(commentIdx + 1).join(' ') : undefined;
                await nftSendCommand(service, args[1], args[2], comment, false);
            } else if (args[0] === 'get') {
                shellHint(['nft get <nft-address>']);
            } else if (args[0] === 'send') {
                shellHint(['nft send <nft-address> <to-address>']);
            } else {
                shellHint([
                    'nft list                  List your NFTs',
                    'nft get <addr>            Get NFT details',
                    'nft send <nft> <to>       Send NFT',
                ]);
            }
            break;

        case 'dns':
            if (args[0] === 'resolve' && args[1]) {
                await dnsResolveCommand(service, args[1], false);
            } else if (args[0] === 'reverse' && args[1]) {
                await dnsReverseCommand(service, args[1], false);
            } else if (args[0] === 'resolve') {
                shellHint(['dns resolve <domain.ton>']);
            } else if (args[0] === 'reverse') {
                shellHint(['dns reverse <address>']);
            } else {
                shellHint([
                    'dns resolve <domain>      Resolve .ton domain',
                    'dns reverse <address>     Reverse DNS lookup',
                ]);
            }
            break;

        case 'help':
            printShellHelp();
            break;

        case 'exit':
        case 'quit':
            return true;

        default:
            if (cmd) {
                shellError(`Unknown command: ${cmd}`);
                process.stderr.write(`  ${dim('Type "help" for available commands.')}\n`);
            }
            break;
    }

    return false;
}

function createPrompt(): { nextLine(): Promise<string | null>; close(): void } {
    const rl = createInterface({
        input: process.stdin,
        output: process.stderr,
        prompt: 'ton> ',
        historySize: 200,
        terminal: true,
    });

    const pending: Array<(value: string | null) => void> = [];
    const buffer: (string | null)[] = [];

    rl.on('line', (line) => {
        const waiter = pending.shift();
        if (waiter) {
            waiter(line.trim());
        } else {
            buffer.push(line.trim());
        }
    });

    rl.on('close', () => {
        const waiter = pending.shift();
        if (waiter) {
            waiter(null);
        } else {
            buffer.push(null);
        }
    });

    return {
        nextLine(): Promise<string | null> {
            rl.prompt();
            const buffered = buffer.shift();
            if (buffered !== undefined) {
                return Promise.resolve(buffered);
            }
            return new Promise((resolve) => {
                pending.push(resolve);
            });
        },
        close() {
            rl.close();
        },
    };
}

export async function shellCommand(
    service: CliWalletService | null,
    jsonMode: boolean,
    createService: () => Promise<CliWalletService>,
): Promise<void> {
    if (jsonMode) {
        process.stderr.write(`  ${symbols.error} Shell is interactive-only. Remove --json flag.\n`);
        return;
    }

    printLogo();
    process.stderr.write(` ${dim('Interactive Shell — Type "help" for commands, "exit" to quit.')}\n\n`);

    let svc = service;
    const prompt = createPrompt();

    while (true) {
        const line = await prompt.nextLine();

        if (line === null) break;
        if (!line) continue;

        if (!svc) {
            try {
                svc = await createService();
            } catch (error) {
                shellError(error instanceof Error ? error.message : 'Failed to initialize wallet.');
                process.stderr.write(`  ${dim('Run "ton setup" first.')}\n\n`);
                continue;
            }
        }

        try {
            const shouldExit = await executeShellCommand(svc, line);
            if (shouldExit) break;
        } catch (error) {
            shellError(error instanceof Error ? error.message : 'Command failed.');
        }

        process.stderr.write('\n');
    }

    prompt.close();
    if (svc) {
        await svc.close();
    }
}
