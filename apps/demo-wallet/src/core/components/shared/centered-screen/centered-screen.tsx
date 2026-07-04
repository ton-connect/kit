/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface CenteredScreenProps {
    /** Optional back button, pinned at the top. */
    onBack?: () => void;
    /** Optional action area, pinned at the bottom. */
    footer?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Full-screen onboarding layout: back button pinned top, actions pinned bottom,
 * content vertically centered in between and scrollable when it doesn't fit.
 */
export const CenteredScreen: React.FC<CenteredScreenProps> = ({ onBack, footer, children }) => (
    <div className="h-dvh bg-white select-none flex flex-col">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1 min-h-0">
            {onBack && (
                // Pin the back button to the top so it stays reachable while the content
                // scrolls or the on-screen keyboard is open (matches NewLayout's header).
                // Use a small FIXED top pad, NOT env(safe-area-inset-top): in a browser tab
                // (not a standalone PWA) the top inset tracks the address bar showing/hiding,
                // which produced a large, fluctuating gap above the back arrow on both iOS
                // Safari and Android Chrome. The content already sits below the browser chrome,
                // so a constant pad gives one small, stable offset on both platforms. (This
                // layout scrolls its own inner container, not <body>, so the back button does
                // not need position:fixed the way NewLayout's header does.)
                <div className="sticky top-0 z-20 flex-shrink-0 bg-white pt-2">
                    <div className="px-4 pt-1 pb-1">
                        <button
                            type="button"
                            onClick={onBack}
                            aria-label="Back"
                            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="min-h-full flex flex-col justify-center py-6">{children}</div>
            </div>

            {/* Bottom clearance for the pinned actions. env(safe-area-inset-bottom) covers the
                iOS home indicator and the Android gesture pill, but Android 3-button navigation
                reports a 0 inset while its ~48dp opaque bar still overlaps the viewport bottom —
                so the inset alone left the actions clipped there. Reserve a base that clears the
                3-button bar (3rem ≈ 48dp) OR the safe-area inset plus the original comfortable
                spacing, whichever is larger. Desktop/gesture keep a normal footer margin. */}
            {footer && (
                <div className="flex-shrink-0 px-4 pt-2 pb-[max(3rem,calc(1.5rem+env(safe-area-inset-bottom)))]">
                    {footer}
                </div>
            )}
        </div>
    </div>
);
