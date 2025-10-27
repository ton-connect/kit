/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BrowserContext } from '@playwright/test';

export async function getExtensionId(context: BrowserContext) {
    let [background] = context.serviceWorkers();
    if (!background) {
        background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    if (!extensionId) {
        throw new Error('[getExtensionId] can not getting extensionId');
    }
    return extensionId;
}
