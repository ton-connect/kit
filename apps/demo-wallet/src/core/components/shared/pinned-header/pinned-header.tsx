/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/core/lib/utils';

interface PinnedHeaderProps {
    children: React.ReactNode;
    /** Extra classes for the centered inner bar (e.g. flex layout for the header row). */
    className?: string;
}

/**
 * Top app bar that stays visible above the page content on every screen.
 *
 * Positioning is split by breakpoint:
 * - Mobile (`< md`): `position: fixed`, viewport-relative. This is deliberate.
 *   When a vaul bottom sheet opens on iOS Safari it pins the document with
 *   `body { position: fixed; top: -scrollY }` (vaul's use-position-fixed scroll
 *   lock). A `position: sticky` header sticks to its scroll container — but a
 *   `position: fixed` <body> is no longer the scroll container, so a sticky
 *   header detaches and drops out for the sheet's whole lifetime, then snaps
 *   back late after vaul's async scroll restore. A `position: fixed` header is
 *   anchored to the viewport (initial containing block), so it is immune to the
 *   body being pulled to `top:-scrollY` and stays painted in place — dimmed
 *   under the sheet's overlay — regardless of scroll position, on open and on
 *   close. A flow spacer of the measured header height keeps the page content
 *   from jumping up under the fixed bar.
 * - Desktop (`>= md`): `position: sticky`. Radix Dialog (the desktop modal) locks
 *   scroll via `overflow: hidden` (react-remove-scroll), NOT `position: fixed`,
 *   so sticky is unaffected there. Keeping desktop on sticky avoids introducing a
 *   fixed-vs-flow reflow on the wider layout, where the sheet problem never occurs.
 *
 * The bar spans the viewport width so the fixed layer isn't clipped; the inner
 * element re-applies the `max-w-md` centered column so the controls line up with
 * the page content on tablet/desktop.
 *
 * Top padding is a small FIXED value (not `env(safe-area-inset-top)`). In a
 * browser tab (not a standalone PWA) the top inset tracks the address bar
 * showing/hiding, which produced a large, fluctuating gap above the bar on both
 * iOS Safari and Android Chrome. The in-app bar already sits below the browser
 * chrome, so a constant pad gives one small, stable offset on both platforms.
 */
export const PinnedHeader: React.FC<PinnedHeaderProps> = ({ children, className }) => {
    const barRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    // Track the bar's rendered height so the flow spacer reserves exactly that
    // much space under the fixed bar (mobile only). Height is content-driven
    // (wallet name length, screen title), so measure it rather than hardcode.
    useLayoutEffect(() => {
        const node = barRef.current;
        if (!node) return;
        const update = () => setHeight(node.getBoundingClientRect().height);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div
                ref={barRef}
                // Mobile: fixed + small stable top pad. Desktop: sticky, no extra pad
                // (matches the prior env()-inset-0 behaviour on desktop; inset-x-0 is inert
                // under position:sticky, so the bar keeps its normal in-flow column width).
                className="fixed inset-x-0 top-0 z-20 bg-white pt-2 md:sticky md:pt-0"
            >
                <div className={cn('max-w-md mx-auto', className)}>{children}</div>
            </div>
            {/* Flow spacer: reserve the bar's height so content starts below it.
                Only needed while the bar is `fixed` (mobile); on `md:` the bar is
                sticky and already occupies flow, so collapse the spacer. */}
            <div className="md:hidden" style={{ height }} aria-hidden />
        </>
    );
};
