/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON CLI - Agent-friendly command-line wallet toolkit for TON blockchain
 *
 * Usage:
 *   npx @ton/cli                              # Welcome screen
 *   npx @ton/cli setup                        # Interactive setup wizard
 *   npx @ton/cli shell                        # Interactive REPL
 *   npx @ton/cli wallet                       # Show wallet info
 *   npx @ton/cli balance                      # Get TON balance
 *   npx @ton/cli balance --json               # JSON output for agents
 *   npx @ton/cli send ton <to> <amount>       # Send TON
 *
 * Credentials (checked in order):
 *   1. CLI flags: --mnemonic, --private-key
 *   2. Environment: MNEMONIC, PRIVATE_KEY
 *   3. Config file: ~/.config/ton/config.json
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    MemoryStorageAdapter,
    Network,
} from '@ton/walletkit';
import type { Wallet, ApiClientConfig, WalletSigner } from '@ton/walletkit';

import { CliWalletService } from './services/CliWalletService.js';
import { resolveCredentials } from './utils/config.js';
import { printLogo, getVersion } from './utils/logo.js';
import { printError, dim } from './utils/output.js';
import { walletCommand } from './commands/wallet.js';
import { balanceCommand, jettonBalanceCommand } from './commands/balance.js';
import { transactionsCommand } from './commands/transactions.js';
import { jettonsCommand, knownJettonsCommand } from './commands/jettons.js';
import { dnsResolveCommand, dnsReverseCommand } from './commands/dns.js';
import { nftListCommand, nftGetCommand, nftSendCommand } from './commands/nft.js';
import { sendTonCommand, sendJettonCommand, sendRawCommand } from './commands/send.js';
import { swapQuoteCommand } from './commands/swap.js';
import { setupCommand } from './commands/setup.js';
import { walletShowCommand, walletImportCommand, walletResetCommand } from './commands/wallet-mgmt.js';
import { shellCommand } from './commands/shell.js';

// ─── Arg Parsing ─────────────────────────────────────────

interface ParsedArgs {
    command: string[];
    json: boolean;
    network?: string;
    mnemonic?: string;
    privateKey?: string;
    walletVersion?: string;
    help: boolean;
    version: boolean;
    limit?: number;
    offset?: number;
    comment?: string;
    messages?: string;
    slippage?: number;
    force: boolean;
    noColor: boolean;
    verbose: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
    const result: ParsedArgs = {
        command: [],
        json: false,
        help: false,
        version: false,
        force: false,
        noColor: false,
        verbose: false,
    };

    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];

        if (arg === '--json' || arg === '-o') {
            if (arg === '-o' && argv[i + 1] === 'json') {
                i++;
            }
            result.json = true;
        } else if (arg === '--network' && argv[i + 1]) {
            result.network = argv[++i];
        } else if (arg === '--mnemonic' && argv[i + 1]) {
            result.mnemonic = argv[++i];
        } else if (arg === '--private-key' && argv[i + 1]) {
            result.privateKey = argv[++i];
        } else if (arg === '--wallet-version' && argv[i + 1]) {
            result.walletVersion = argv[++i];
        } else if (arg === '--limit' && argv[i + 1]) {
            result.limit = parseInt(argv[++i], 10);
        } else if (arg === '--offset' && argv[i + 1]) {
            result.offset = parseInt(argv[++i], 10);
        } else if (arg === '--comment' && argv[i + 1]) {
            result.comment = argv[++i];
        } else if (arg === '--messages' && argv[i + 1]) {
            result.messages = argv[++i];
        } else if (arg === '--slippage' && argv[i + 1]) {
            result.slippage = parseInt(argv[++i], 10);
        } else if (arg === '--force') {
            result.force = true;
        } else if (arg === '--no-color') {
            result.noColor = true;
        } else if (arg === '--verbose') {
            result.verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            result.help = true;
        } else if (arg === '--version' || arg === '-v') {
            result.version = true;
        } else if (!arg.startsWith('-')) {
            result.command.push(arg);
        }
        i++;
    }

    return result;
}

// ─── Help ────────────────────────────────────────────────

function printHelp(): void {
    printLogo();
    process.stderr.write(dim('  Usage: ton <command> [options]\n\n'));
    process.stderr.write(dim('  Commands:\n'));
    process.stderr.write('    setup                              Interactive setup wizard\n');
    process.stderr.write('    shell                              Interactive REPL\n');
    process.stderr.write('    wallet                             Show wallet info\n');
    process.stderr.write('    wallet show                        Show wallet configuration\n');
    process.stderr.write('    wallet import                      Import wallet credentials\n');
    process.stderr.write('    wallet reset                       Delete wallet configuration\n');
    process.stderr.write('    balance                            Get TON balance\n');
    process.stderr.write('    balance jetton <addr>              Get jetton balance\n');
    process.stderr.write('    jettons                            List all tokens in wallet\n');
    process.stderr.write('    jettons known                      List popular tokens\n');
    process.stderr.write('    transactions                       Recent transaction history\n');
    process.stderr.write('    send ton <to> <amount>             Send TON\n');
    process.stderr.write('    send jetton <to> <jetton> <amount> Send tokens\n');
    process.stderr.write('    send raw --messages <json>         Send raw transaction\n');
    process.stderr.write('    swap quote <from> <to> <amount>    Get swap quote\n');
    process.stderr.write('    nft list                           List NFTs\n');
    process.stderr.write('    nft get <addr>                     Get NFT details\n');
    process.stderr.write('    nft send <nft> <to>                Send NFT\n');
    process.stderr.write('    dns resolve <domain>               Resolve .ton domain\n');
    process.stderr.write('    dns reverse <address>              Reverse DNS lookup\n');
    process.stderr.write('\n');
    process.stderr.write(dim('  Global Flags:\n'));
    process.stderr.write('    --json, -o json                    JSON output (agent-friendly)\n');
    process.stderr.write('    --network mainnet|testnet          Override network\n');
    process.stderr.write('    --mnemonic "..."                   Provide mnemonic\n');
    process.stderr.write('    --private-key 0x...                Provide private key\n');
    process.stderr.write('    --no-color                         Disable colors\n');
    process.stderr.write('    --verbose                          Show debug logs\n');
    process.stderr.write('    --help, -h                         Show help\n');
    process.stderr.write('    --version, -v                      Show version\n');
    process.stderr.write('\n');
    process.stderr.write(dim('  Credentials (checked in order):\n'));
    process.stderr.write(dim('    1. CLI flags: --mnemonic, --private-key\n'));
    process.stderr.write(dim('    2. Environment: MNEMONIC, PRIVATE_KEY\n'));
    process.stderr.write(dim('    3. Config file: ~/.config/ton/config.json\n'));
    process.stderr.write('\n');
}

// ─── Wallet Creation ─────────────────────────────────────

interface ServiceContext {
    service: CliWalletService;
    kit: TonWalletKit;
}

async function createWalletService(args: ParsedArgs): Promise<ServiceContext> {
    const creds = resolveCredentials({
        mnemonic: args.mnemonic,
        privateKey: args.privateKey,
        network: args.network,
        walletVersion: args.walletVersion,
    });

    if (!creds.mnemonic && !creds.privateKey) {
        throw new Error('MNEMONIC or PRIVATE_KEY is required.');
    }

    const network = creds.network === 'testnet' ? Network.testnet() : Network.mainnet();

    const apiConfig: ApiClientConfig = {};
    if (creds.toncenterApiKey) {
        apiConfig.url = creds.network === 'mainnet' ? 'https://toncenter.com' : 'https://testnet.toncenter.com';
        apiConfig.key = creds.toncenterApiKey;
    }

    const kit = new TonWalletKit({
        networks: {
            [network.chainId]: { apiClient: apiConfig },
        },
        storage: new MemoryStorageAdapter(),
    });
    await kit.waitForReady();

    let signer: WalletSigner;
    if (creds.mnemonic) {
        const words = creds.mnemonic.trim().split(/\s+/);
        signer = await Signer.fromMnemonic(words, { type: 'ton' });
    } else {
        const keyStripped = creds.privateKey!.replace('0x', '');
        signer = await Signer.fromPrivateKey(Buffer.from(keyStripped, 'hex'));
    }

    const walletAdapter =
        creds.walletVersion === 'v4r2'
            ? await WalletV4R2Adapter.create(signer, { client: kit.getApiClient(network), network })
            : await WalletV5R1Adapter.create(signer, { client: kit.getApiClient(network), network });

    let wallet: Wallet | undefined = await kit.addWallet(walletAdapter);
    if (!wallet) {
        wallet = kit.getWallet(walletAdapter.getWalletId());
    }
    if (!wallet) {
        throw new Error('Failed to create wallet');
    }

    const service = await CliWalletService.create({
        wallet: walletAdapter,
        networks: {
            mainnet:
                creds.toncenterApiKey && creds.network === 'mainnet' ? { apiKey: creds.toncenterApiKey } : undefined,
            testnet:
                creds.toncenterApiKey && creds.network === 'testnet' ? { apiKey: creds.toncenterApiKey } : undefined,
        },
    });

    return { service, kit };
}

// ─── Main Router ─────────────────────────────────────────

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    if (!args.verbose) {
        const noop = () => {};
        // eslint-disable-next-line no-console
        console.debug = noop;
        // eslint-disable-next-line no-console
        console.info = noop;
    }

    if (args.noColor) {
        process.env.NO_COLOR = '1';
    }

    if (args.version) {
        process.stdout.write(getVersion() + '\n');
        return;
    }

    const [cmd, sub, ...rest] = args.command;

    if (!cmd || args.help) {
        printHelp();
        return;
    }

    // Commands that don't need a wallet
    if (cmd === 'setup') {
        await setupCommand(args.json);
        return;
    }

    if (cmd === 'jettons' && sub === 'known') {
        knownJettonsCommand(args.json);
        return;
    }

    if (cmd === 'wallet' && (sub === 'show' || (!sub && args.help))) {
        await walletShowCommand(args.json);
        return;
    }

    if (cmd === 'wallet' && sub === 'import') {
        await walletImportCommand(args.mnemonic, args.privateKey, args.network, args.walletVersion, args.json);
        return;
    }

    if (cmd === 'wallet' && sub === 'reset') {
        await walletResetCommand(args.force, args.json);
        return;
    }

    if (cmd === 'shell') {
        const create = () => createWalletService(args);
        let ctx: ServiceContext | null = null;
        try {
            ctx = await create();
        } catch {
            // Shell will create service on demand
        }
        try {
            await shellCommand(ctx?.service ?? null, args.json, async () => (await create()).service);
        } finally {
            if (ctx) {
                await ctx.service.close();
                await ctx.kit.close();
            }
        }
        return;
    }

    // Commands that need a wallet
    let ctx: ServiceContext;
    try {
        ctx = await createWalletService(args);
    } catch (error) {
        printError(
            args.json,
            error instanceof Error ? error.message : 'Unknown error',
            'Run "ton setup" to configure your wallet, or provide --mnemonic / --private-key.',
        );
        return;
    }

    const { service } = ctx;
    try {
        switch (cmd) {
            case 'wallet':
                await walletCommand(service, args.json);
                break;

            case 'balance':
                if (sub === 'jetton' && rest[0]) {
                    await jettonBalanceCommand(service, rest[0], args.json);
                } else {
                    await balanceCommand(service, args.json);
                }
                break;

            case 'jettons':
                await jettonsCommand(service, args.json);
                break;

            case 'transactions':
                await transactionsCommand(service, args.limit ?? 20, args.json);
                break;

            case 'send':
                if (sub === 'ton' && rest[0] && rest[1]) {
                    await sendTonCommand(service, rest[0], rest[1], args.comment, args.json);
                } else if (sub === 'jetton' && rest[0] && rest[1] && rest[2]) {
                    await sendJettonCommand(service, rest[0], rest[1], rest[2], args.comment, args.json);
                } else if (sub === 'raw' && args.messages) {
                    await sendRawCommand(service, args.messages, args.json);
                } else {
                    printError(
                        args.json,
                        'Invalid send command.',
                        'Usage: ton send ton <to> <amount> | ton send jetton <to> <jetton> <amount> | ton send raw --messages <json>',
                    );
                }
                break;

            case 'swap':
                if (sub === 'quote' && rest[0] && rest[1] && rest[2]) {
                    await swapQuoteCommand(service, rest[0], rest[1], rest[2], args.slippage, args.json);
                } else {
                    printError(args.json, 'Invalid swap command.', 'Usage: ton swap quote <from> <to> <amount>');
                }
                break;

            case 'nft':
                if (sub === 'list') {
                    await nftListCommand(service, args.limit ?? 20, args.offset ?? 0, args.json);
                } else if (sub === 'get' && rest[0]) {
                    await nftGetCommand(service, rest[0], args.json);
                } else if (sub === 'send' && rest[0] && rest[1]) {
                    await nftSendCommand(service, rest[0], rest[1], args.comment, args.json);
                } else {
                    printError(
                        args.json,
                        'Invalid nft command.',
                        'Usage: ton nft list | ton nft get <addr> | ton nft send <nft> <to>',
                    );
                }
                break;

            case 'dns':
                if (sub === 'resolve' && rest[0]) {
                    await dnsResolveCommand(service, rest[0], args.json);
                } else if (sub === 'reverse' && rest[0]) {
                    await dnsReverseCommand(service, rest[0], args.json);
                } else {
                    printError(
                        args.json,
                        'Invalid dns command.',
                        'Usage: ton dns resolve <domain> | ton dns reverse <address>',
                    );
                }
                break;

            default:
                printError(args.json, `Unknown command: ${cmd}`, 'Run "ton --help" for available commands.');
                break;
        }
    } finally {
        await service.close();
        await ctx.kit.close();
    }
}

main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(`[ton-cli] Fatal error:`, error);
    process.exit(1);
});
