import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

if (!process.env.WALLET_MNEMONIC) {
    // eslint-disable-next-line no-console
    console.error('WALLET_MNEMONIC not set');
    process.exit(1);
}

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    reporter: [['html'], ['list']],
    use: {
        screenshot: 'on',
        trace: 'on',
        permissions: ['clipboard-read', 'clipboard-write'],
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
});
