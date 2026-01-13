/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import type { SignDataPreview } from '@ton/walletkit';

// SAMPLE_START: RENDER_SIGN_DATA_PREVIEW
export function renderSignDataPreview(preview: SignDataPreview) {
    switch (preview.kind) {
        case 'text':
            return { type: 'text', content: preview.content };
        case 'binary':
            return { type: 'binary', content: preview.content };
        case 'cell':
            return {
                type: 'cell',
                content: preview.content,
                schema: preview.schema,
                parsed: preview.parsed,
            };
    }
}
// SAMPLE_END: RENDER_SIGN_DATA_PREVIEW
