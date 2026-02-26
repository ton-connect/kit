/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network } from '@ton/appkit';
import { AppKitProvider } from '@ton/appkit-react';
import { tonConnect } from '@ton/appkit';
import type { FC } from 'react';

// Initialize AppKit (outside component)
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: { url: 'https://toncenter.com', key: 'your-key' },
        },
    },
    connectors: [
        tonConnect({
            tonConnectOptions: { manifestUrl: 'https://your-app.com/tonconnect-manifest.json' },
        }),
    ],
});

export const AppKitProviderExample: FC = () => {
    // SAMPLE_START: APP_KIT_PROVIDER
    return (
        <AppKitProvider appKit={appKit}>
            {/* Your App Content */}
            <div>My App</div>
        </AppKitProvider>
    );
    // SAMPLE_END: APP_KIT_PROVIDER
};
