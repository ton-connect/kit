/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
    // Handle TON Connect deeplinks - prevent Expo Router from treating them as routes
    if (path.startsWith('tonkeeper://ton-connect') || path.includes('tc://') || path.includes('ton://')) {
        // Return null to cancel navigation - useDeepLinkHandler will handle the URL
        return null;
    }

    return path;
}
