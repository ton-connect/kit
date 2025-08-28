// Script that passes messages between the content script and the background script
// Runs in the isolated world of the webpage

import { injectIsolatedCode } from '@ton/walletkit/bridge';

async function main() {
    injectIsolatedCode(window, {
        walletName: 'tonkeeper',
        deviceInfo: {
            platform: 'web',
            appName: 'Tonkeeper',
            appVersion: '1.0.0',
            maxProtocolVersion: 2,
            features: [
                {
                    name: 'SendTransaction',
                    maxMessages: 4,
                },
                {
                    name: 'SignData',
                    types: ['text', 'binary', 'cell'],
                },
            ],
        },
        walletInfo: {
            name: 'Tonkeeper',
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN0RGRiIvPgo8cGF0aCBkPSJNOSA5SDE0VjE0SDlWOVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9K0xOIA5SDIzVjE0SDE4VjlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNOSAxOEgxNFYyM0g5VjE4WiIgZmlsbD0id2hpdGUiLz4KPHA+PC9zdmc+',
            about_url: 'https://example.com/about',
        },
    });
}

main();
