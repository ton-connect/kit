/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

import { PinnedHeader } from '../pinned-header';

interface NewLayoutProps {
    header?: React.ReactNode;
    children: React.ReactNode;
}

export const NewLayout: React.FC<NewLayoutProps> = ({ header, children }) => {
    return (
        <div className="min-h-dvh bg-white select-none">
            <div className="max-w-md mx-auto">
                {/* Pin the top nav so its controls (back button on sub-screens; Connect-to-dApp,
                    wallet switcher and settings on the dashboard) stay reachable while the page
                    scrolls, the on-screen keyboard is open, or a bottom sheet is open over a
                    scrolled page. PinnedHeader is `fixed` on mobile so it survives vaul's iOS
                    body scroll-lock (a sticky header would drop out under it); see its doc. */}
                {header && <PinnedHeader>{header}</PinnedHeader>}
                <main className="px-4 pb-6">{children}</main>
            </div>
        </div>
    );
};
