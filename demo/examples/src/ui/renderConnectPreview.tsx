/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectionRequestEvent } from '@ton/walletkit';

// SAMPLE_START: RENDER_CONNECT_PREVIEW
function renderConnectPreview(req: ConnectionRequestEvent) {
    const name = req.preview.dAppInfo?.name ?? req.dAppInfo?.name;
    const description = req.preview.dAppInfo?.description;
    const iconUrl = req.preview.dAppInfo?.iconUrl;
    const permissions = req.preview.permissions ?? [];

    return {
        title: `Connect to ${name}?`,
        iconUrl,
        description,
        permissions: permissions.map((p) => ({ title: p.title, description: p.description })),
    };
}
// SAMPLE_END: RENDER_CONNECT_PREVIEW

export function applyRenderConnectPreview(req: ConnectionRequestEvent) {
    return renderConnectPreview(req);
}
