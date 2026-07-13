/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { ChevronLeft, X } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '../dialog';
import { Drawer, DrawerContent, DrawerTitle } from '../drawer';

import { cn } from '@/core/lib/utils';
import { isIOS } from '@/core/lib/is-ios';
import { useIsMobile } from '@/core/hooks/use-media-query';

export interface ModalContainerProps extends ComponentProps<'div'> {
    isOpened: boolean;
    onOpenChange: (value: boolean) => void;
    /** When false, the modal can't be dismissed by backdrop / Esc / swipe — only via its own actions. */
    dismissible?: boolean;
    /**
     * Set for drawers that contain a focusable input (textarea / text field).
     * Keeps the mobile bottom-sheet path as a compact, content-height sheet
     * (rounded top, bottom-anchored — the default sheet look) but drives it with
     * a manual, `visualViewport`-based keyboard lift: while the software keyboard
     * is open the sheet's `bottom` offset is raised by the keyboard height so the
     * whole panel — input AND action button — sits directly above the keyboard.
     * vaul's own `repositionInputs` is disabled (it mutates the sheet height/bottom
     * from the same resize events and misfires: fly-off on Android, off-screen on
     * the first iOS focus). On iOS the body scroll-lock is kept so focusing the
     * input can't scroll the document and drag the fixed sheet away. No effect on
     * desktop (Dialog).
     */
    keyboardSafe?: boolean;
}

/**
 * Height (in CSS px) of the on-screen keyboard as it overlaps the layout
 * viewport, derived from `window.visualViewport`. With the default
 * `interactive-widget=resizes-visual` (both iOS Safari and Android Chrome), the
 * keyboard shrinks only the *visual* viewport; the layout viewport — and thus
 * any `position: fixed` element — is unaffected. So the overlap is
 * `innerHeight − visualViewport.height − visualViewport.offsetTop`, and adding
 * that as a `bottom` offset lifts a bottom-anchored fixed sheet to rest right on
 * top of the keyboard. Returns 0 when the keyboard is closed (or when
 * `visualViewport` is unavailable). Updates are rAF-throttled and only run while
 * `enabled` (the keyboardSafe sheet is open on mobile), so no other sheet or the
 * desktop Dialog is affected.
 */
const useKeyboardInset = (enabled: boolean): number => {
    const [inset, setInset] = useState(0);

    useEffect(() => {
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        if (!enabled || !vv) {
            setInset(0);
            return;
        }

        let frame = 0;
        const measure = () => {
            frame = 0;
            // Clamp ≥ 0: during the open/close animation the terms can cross by a
            // sub-pixel and go slightly negative. Sub-2px results are treated as
            // "keyboard closed" to avoid a 1px jitter when it's not really open.
            const raw = window.innerHeight - vv.height - vv.offsetTop;
            setInset(raw > 2 ? Math.round(raw) : 0);
        };
        const onChange = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(measure);
        };

        // resize fires as the keyboard animates in/out; scroll fires when the
        // visual viewport pans (offsetTop changes) with the keyboard open.
        vv.addEventListener('resize', onChange);
        vv.addEventListener('scroll', onChange);
        measure();

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            vv.removeEventListener('resize', onChange);
            vv.removeEventListener('scroll', onChange);
            setInset(0);
        };
    }, [enabled]);

    return inset;
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
    isOpened,
    onOpenChange,
    dismissible = true,
    keyboardSafe = false,
    children,
    className,
    ...props
}) => {
    const isMobile = useIsMobile();
    // Track the keyboard height only while the keyboardSafe sheet is open on mobile;
    // drives the manual lift below. No-op (0) for every other sheet, on desktop, and
    // while this sheet is closed (no visualViewport listeners attached then).
    const keyboardInset = useKeyboardInset(isMobile && keyboardSafe && isOpened);

    if (isMobile) {
        // The only sheet with a focusable text input is the Connect-to-dApp paste
        // sheet (keyboardSafe). Its keyboard handling is tuned per platform below;
        // isIOS() gates only the iOS-specific body scroll-lock, not the shared
        // repositionInputs / lift handling.
        const iosKeyboardWorkaround = keyboardSafe && isIOS();

        return (
            <Drawer
                open={isOpened}
                onOpenChange={onOpenChange}
                dismissible={dismissible}
                // vaul's repositionInputs listens to visualViewport resize and mutates the
                // sheet's height/bottom when the keyboard opens. On iOS it misfires on the
                // first focus and throws a fixed sheet off-screen; on Android it shoves the
                // sheet up as the keyboard opens (the "flies off" regression). Disable it for
                // the input sheet on BOTH platforms and drive the keyboard lift ourselves via
                // useKeyboardInset (bottom offset). With repositionInputs off vaul writes
                // neither `height` nor `bottom` on the drawer root (both live inside its
                // onVisualViewportChange handler, which early-returns), so our `bottom` lift is
                // uncontested. Input-less sheets keep the default (undefined ⇒ true), harmless
                // as they never focus an input.
                repositionInputs={keyboardSafe ? false : undefined}
                shouldScaleBackground={false}
                // noBodyStyles controls vaul's iOS body scroll-lock (position:fixed + top:-scrollY
                // on <body>, iOS Safari only — Android is never affected as vaul gates it on
                // isSafari()).
                //
                // - Input-less sheets (!keyboardSafe): suppress it. The lock breaks a
                //   position:sticky header, which is why we now pin the header with
                //   position:fixed (PinnedHeader). With that in place the header no longer
                //   needs the lock, and suppressing it also avoids vaul's async scroll-restore
                //   jump on close (the wallet-switcher / settings sheets have no manual restore).
                // - Input sheet on iOS (iosKeyboardWorkaround): KEEP the lock (noBodyStyles=false).
                //   With repositionInputs off, the lock is what stops iOS from scrolling the
                //   document when the textarea is focused, which would otherwise drag the fixed
                //   sheet off-screen. The connect sheet restores scroll manually on close.
                // - Input sheet on Android: noBodyStyles=true, but it's a no-op there anyway.
                noBodyStyles={!iosKeyboardWorkaround}
            >
                <DrawerContent
                    className={cn(
                        'max-w-md mx-auto',
                        // Input sheet stays a compact, content-height bottom sheet (the default
                        // rounded-top, bottom-anchored look). Cap it to the visual viewport with
                        // internal scroll so an unusually tall sheet can't overflow above the
                        // keyboard. The lift itself is the `bottom` offset below.
                        keyboardSafe && 'max-h-[85dvh] overflow-y-auto overscroll-contain',
                        className,
                    )}
                    // Manual keyboard lift: raise the whole (fixed, bottom-anchored) panel by the
                    // keyboard height so the input and the Connect button sit right above the
                    // keyboard. Driven by the visualViewport resize stream (rAF-throttled), which
                    // supplies intermediate heights as the keyboard animates — so the sheet tracks
                    // the keyboard smoothly without needing a CSS transition (vaul re-inlines
                    // `transition: transform` on the root, which would otherwise drop a `bottom`
                    // transition). The overlay is `fixed inset-0`, so the dashboard stays fully
                    // dimmed behind the sheet at any offset (no bleed-through). 0 ⇒ resting at the
                    // bottom edge, identical to the default sheet. Merged after {...props} so it
                    // wins over any caller style but still preserves the caller's other props.
                    aria-describedby={undefined}
                    {...props}
                    style={keyboardSafe && keyboardInset > 0 ? { ...props.style, bottom: keyboardInset } : props.style}
                >
                    {children}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpened} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn('max-w-md rounded-2xl p-0 gap-0', className)}
                aria-describedby={undefined}
                onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
                onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
                {...props}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
};

interface ModalHeaderProps extends ComponentProps<'div'> {
    onClose?: () => void;
    /** Renders a round back button (same style as nft/assets ScreenHeader) before the title. */
    onBack?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose, onBack, children, className, ...props }) => (
    <div className={cn('flex items-center justify-between px-4 pt-3 pb-5 md:pt-5', className)} {...props}>
        <div className="flex items-center gap-2 min-w-0">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                    aria-label="Back"
                >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
            )}
            {children}
        </div>
        {onClose && (
            <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                aria-label="Close"
            >
                <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
        )}
    </div>
);

export const ModalTitle: React.FC<ComponentProps<'h2'>> = ({ className, ...props }) => {
    const isMobile = useIsMobile();
    const Wrapper = isMobile ? DrawerTitle : DialogTitle;
    return <Wrapper className={cn('text-xl font-bold text-gray-900 truncate', className)} {...props} />;
};

export const ModalBody: React.FC<ComponentProps<'div'>> = ({ children, className, ...props }) => (
    <div className={cn('flex flex-col px-4 pb-6', className)} {...props}>
        {children}
    </div>
);

export const ModalFooter: React.FC<ComponentProps<'div'>> = ({ children, className, ...props }) => (
    <div className={cn('flex flex-col gap-2 px-4 pb-6', className)} {...props}>
        {children}
    </div>
);

export const Modal = {
    Container: ModalContainer,
    Header: ModalHeader,
    Title: ModalTitle,
    Body: ModalBody,
    Footer: ModalFooter,
};
