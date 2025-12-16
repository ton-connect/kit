/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import { fileURLToPath } from 'url';

import type { Page, TestInfo } from '@playwright/test';
import { test } from '@playwright/test';

import type { ConfigFixture } from '../qa';
import { launchPersistentContext, getExtensionId, TonConnectWidget, testWith } from '../qa';
import type { TestFixture } from '../qa';
import { DemoWallet } from './DemoWallet';
import { isExtensionWalletSource } from '../qa/WalletApp';

const enableDebugLogs = process.env.E2E_DEBUG_LOGS === 'true' || !!process.env.CI;
const enableVerboseDebugLogs = process.env.E2E_DEBUG_LOGS_VERBOSE === 'true';

type PageDebugState = {
    lastUrl?: string;
    lastTitle?: string;
};

const pageDebugState = new WeakMap<Page, PageDebugState>();
let signalHandlersInstalled = false;

function prefix(testInfo: TestInfo): string {
    const project = testInfo.project?.name ?? 'unknown-project';
    return `[E2E][${project}][${testInfo.title}]`;
}

function safeText(value: unknown, maxLen = 700): string {
    const str = typeof value === 'string' ? value : String(value);
    return str.length > maxLen ? `${str.slice(0, maxLen)}…(truncated)` : str;
}

function installCancelHandlers(testInfo: TestInfo, getPages: () => Page[]): void {
    if (signalHandlersInstalled) return;
    signalHandlersInstalled = true;

    const dump = (signal: string) => {
        // eslint-disable-next-line no-console
        console.error(`${prefix(testInfo)} received ${signal}. Dumping open pages state:`);
        try {
            for (const p of getPages()) {
                const state = pageDebugState.get(p);
                // eslint-disable-next-line no-console
                console.error(
                    `${prefix(testInfo)} page url=${safeText(state?.lastUrl ?? p.url())} title=${safeText(
                        state?.lastTitle ?? '',
                    )}`,
                );
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`${prefix(testInfo)} failed to dump pages: ${String(e)}`);
        }
    };

    process.once('SIGTERM', () => dump('SIGTERM'));
    process.once('SIGINT', () => dump('SIGINT'));
}

function attachDebugLogging(page: Page, testInfo: TestInfo): void {
    if (!enableDebugLogs) return;
    if (pageDebugState.has(page)) return;

    pageDebugState.set(page, {});

    const updateState = async () => {
        const state = pageDebugState.get(page);
        if (!state) return;
        try {
            state.lastUrl = page.url();
            state.lastTitle = await page.title().catch(() => state.lastTitle);
        } catch {
            // ignore
        }
    };

    page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) void updateState();
    });
    page.on('load', () => void updateState());
    void updateState();

    page.on('pageerror', (err) => {
        // eslint-disable-next-line no-console
        console.error(`${prefix(testInfo)} [pageerror] ${safeText(err?.stack ?? err)}`);
    });

    page.on('console', (msg) => {
        const type = msg.type();
        if (!enableVerboseDebugLogs && type !== 'error' && type !== 'warning') return;
        // eslint-disable-next-line no-console
        console.log(`${prefix(testInfo)} [console:${type}] ${safeText(msg.text())}`);
    });

    page.on('requestfailed', (req) => {
        // eslint-disable-next-line no-console
        console.error(
            `${prefix(testInfo)} [requestfailed] ${req.method()} ${req.url()} ${safeText(req.failure()?.errorText ?? '')}`,
        );
    });

    page.on('response', (res) => {
        const status = res.status();
        if (status < 400) return;
        // eslint-disable-next-line no-console
        console.error(`${prefix(testInfo)} [http ${status}] ${res.request().method()} ${res.url()}`);
    });
}

export function detectWalletSource() {
    const source = process.env.E2E_WALLET_SOURCE ?? 'http://localhost:5173/';
    const extensionPath = process.env.E2E_WALLET_SOURCE_EXTENSION;
    if (extensionPath && extensionPath !== 'false' && extensionPath !== '0') {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const result = path.resolve(__dirname, extensionPath);
        return result;
    }
    return source;
}

export function demoWalletFixture(config: ConfigFixture, slowMo = 0) {
    const walletSource = config.walletSource ?? detectWalletSource();
    const isExtension = isExtensionWalletSource(walletSource);
    const mnemonic = config.mnemonic ?? process.env.WALLET_MNEMONIC;

    return test.extend<TestFixture>({
        context: async ({ context: _ }, use, testInfo) => {
            const extensionPath = isExtension ? walletSource : '';
            const context = await launchPersistentContext(extensionPath, slowMo);
            if (enableDebugLogs) {
                // eslint-disable-next-line no-console
                console.log(
                    `${prefix(testInfo)} starting fixtures: appUrl=${safeText(config.appUrl)} walletSource=${safeText(
                        walletSource,
                    )} extension=${String(isExtension)} headless=${safeText(process.env.ENABLE_HEADLESS ?? '(default)')}`,
                );
                installCancelHandlers(testInfo, () => context.pages());
                context.on('page', (p) => attachDebugLogging(p, testInfo));
                for (const p of context.pages()) attachDebugLogging(p, testInfo);
            }
            await use(context);
            await context.close();
        },
        app: async ({ context }, use, testInfo) => {
            // @ts-expect-error - custom property on context
            let app = context._app;
            if (!app) {
                app = await context.newPage();
                // @ts-expect-error - custom property on context
                context._app = app;
                attachDebugLogging(app, testInfo);
                const startedAt = Date.now();
                // eslint-disable-next-line no-console
                if (enableDebugLogs) console.log(`${prefix(testInfo)} opening dapp: ${safeText(config.appUrl)}`);
                app.onReady = await app.goto(config.appUrl, {
                    waitUntil: 'load',
                });
                // eslint-disable-next-line no-console
                if (enableDebugLogs) console.log(`${prefix(testInfo)} dapp loaded in ${Date.now() - startedAt}ms`);
            }
            // const pages = context.pages();
            // context.get

            // let app; // = pages[pages.length - 1]; // return last tab
            // if (!app) {
            //     app = await context.newPage();
            // }

            await use(app);
        },
        widget: async ({ app }, use) => {
            const widget = new TonConnectWidget(app);
            await use(widget);
        },
        wallet: async ({ context }, use, testInfo) => {
            const source = isExtension ? await getExtensionId(context) : walletSource;
            const app = new DemoWallet(context, source);

            if (enableDebugLogs) {
                // eslint-disable-next-line no-console
                console.log(
                    `${prefix(testInfo)} importing wallet. mnemonic=${mnemonic ? '(set)' : '(empty)'} source=${safeText(
                        source,
                    )}`,
                );
            }
            const importPromise = app.importWallet(mnemonic ?? '');
            // await _app.onReady;
            await importPromise;
            await use(app);
        },
    });
}

export function testWithDemoWalletFixture(config: ConfigFixture, slowMo = 0) {
    return testWith(demoWalletFixture(config, slowMo));
}
