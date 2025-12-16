/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { chromium } from '@playwright/test';
import type { Fixtures, TestType } from '@playwright/test';
import { mergeTests, test as base } from '@playwright/test';

export async function launchPersistentContext(extensionPath: string, slowMo = 0) {
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-infobars',
        '--disable-blink-features=AutomationControlled',
        '--use-fake-ui-for-media-stream',
        '--disable-permissions-api',
    ];

    if (extensionPath != '') {
        args.push(`--disable-extensions-except=${extensionPath}`);
        args.push(`--load-extension=${extensionPath}`);
    }

    const isCi = !!process.env.CI;
    const headless =
        process.env.ENABLE_HEADLESS === 'true' ? true : process.env.ENABLE_HEADLESS === 'false' ? false : isCi;

    if (extensionPath !== '' && headless) {
        // eslint-disable-next-line no-console
        console.warn(
            `[E2E] Extension mode detected but headless=true. Chrome extensions usually won't load in headless mode. ` +
                `Set ENABLE_HEADLESS=false in CI for extension e2e (run under xvfb).`,
        );
    }

    if (headless) {
        args.push('--headless=new');
    }

    slowMo = isCi ? 0 : (parseInt(process.env.E2E_SLOW_MO || '0') ?? slowMo);
    const browserContext = await chromium.launchPersistentContext('', {
        args,
        headless,
        slowMo,
    });

    return browserContext;
}

export function testWith<CustomFixtures extends Fixtures>(
    customFixtures: TestType<CustomFixtures, object>,
): TestType<CustomFixtures, object> {
    return mergeTests(base, customFixtures);
}
