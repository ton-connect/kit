import { chromium, type Fixtures, type TestType } from '@playwright/test';
import { mergeTests, test as base } from '@playwright/test';

export function launchPersistentContext(extensionPath: string, slowMo = 0) {
    const args = [];
    if (extensionPath != '') {
        args.push(`--disable-extensions-except=${extensionPath}`);
        args.push(`--load-extension=${extensionPath}`);
    }
    if (process.env.CI) {
        args.push('--headless=new');
    }
    slowMo = process.env.CI ? 0 : (parseInt(process.env.E2E_SLOW_MO) ?? slowMo);
    return chromium.launchPersistentContext('', {
        args,
        headless: false,
        slowMo,
    });
}

export function testWith<CustomFixtures extends Fixtures>(
    customFixtures: TestType<CustomFixtures, object>,
): TestType<CustomFixtures, object> {
    return mergeTests(base, customFixtures);
}
