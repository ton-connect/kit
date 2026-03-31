/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import AppKitContext from '@/core/contexts/context';

import '@/core/styles/app.css';
import '@/core/styles/index.css';
import '@ton/appkit-react/styles.css';

export const metadata: Metadata = {
    title: 'NFT Minter - AppKit Demo App',
    description: 'NFT Minter - AppKit Demo App',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AppKitContext>{children}</AppKitContext>
            </body>
        </html>
    );
}
