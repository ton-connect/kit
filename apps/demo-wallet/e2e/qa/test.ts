/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { chromium, type Fixtures, type TestType } from '@playwright/test';
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
    if (process.env.CI) {
        args.push('--headless=new');
    }
    slowMo = process.env.CI ? 0 : (parseInt(process.env.E2E_SLOW_MO || '0') ?? slowMo);
    const browserContext = await chromium.launchPersistentContext('', {
        args,
        headless: false,
        slowMo,
    });

    return browserContext;
}

export function testWith<CustomFixtures extends Fixtures>(
    customFixtures: TestType<CustomFixtures, object>,
): TestType<CustomFixtures, object> {
    return mergeTests(base, customFixtures);
}
