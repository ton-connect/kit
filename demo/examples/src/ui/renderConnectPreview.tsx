/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

// SAMPLE_START: RENDER_CONNECT_PREVIEW
export function renderConnectPreview(req: EventConnectRequest) {
    const name = req.preview.manifest?.name ?? req.dAppInfo?.name;
    const description = req.preview.manifest?.description;
    const iconUrl = req.preview.manifest?.iconUrl;
    const permissions = req.preview.permissions ?? [];

    return {
        title: `Connect to ${name}?`,
        iconUrl,
        description,
        permissions: permissions.map((p) => ({ title: p.title, description: p.description })),
    };
}
// SAMPLE_END: RENDER_CONNECT_PREVIEW
