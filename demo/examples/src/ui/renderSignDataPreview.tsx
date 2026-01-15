/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataPreview } from '@ton/walletkit';

// SAMPLE_START: RENDER_SIGN_DATA_PREVIEW
function renderSignDataPreview(preview: SignDataPreview) {
    switch (preview.type) {
        case 'text':
            return { type: 'text', content: preview.value.content };
        case 'binary':
            return { type: 'binary', content: preview.value.content };
        case 'cell':
            return {
                type: 'cell',
                content: preview.value.content,
                schema: preview.value.schema,
                parsed: preview.value.parsed,
            };
    }
}
// SAMPLE_END: RENDER_SIGN_DATA_PREVIEW

export function applyRenderSignDataPreview(preview: SignDataPreview) {
    return renderSignDataPreview(preview);
}
