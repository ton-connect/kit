/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Detects iOS Safari / iPadOS Safari, where the software keyboard resizes the
 * *visual* viewport (not the layout viewport) and where `position: fixed` +
 * body scroll-lock interacts badly with focus. Used to opt drawers that contain
 * a focusable input out of vaul's keyboard-repositioning / background-scaling,
 * which otherwise shove the panel off-screen on the first focus.
 *
 * iPadOS 13+ reports a desktop UA ("Macintosh") but has touch points, so we
 * also treat a touch-capable "Mac" as iOS for the purposes of this workaround.
 */
export function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS masquerading as macOS.
    return ua.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document;
}
