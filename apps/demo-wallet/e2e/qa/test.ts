import { chromium, type Fixtures, type TestType } from '@playwright/test';
import { mergeTests, test as base } from '@playwright/test';

export function launchPersistentContext(extensionPath: string, slowMo = 0) {
    const browserArgs = [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`];
    if (process.env.CI) {
        browserArgs.push('--headless=new');
    }
    return chromium.launchPersistentContext('', {
        headless: false,
        args: browserArgs,
        slowMo: process.env.CI ? 0 : slowMo,
    });
}

export function testWith<CustomFixtures extends Fixtures>(
    customFixtures: TestType<CustomFixtures, object>,
): TestType<CustomFixtures, object> {
    return mergeTests(base, customFixtures);
}
