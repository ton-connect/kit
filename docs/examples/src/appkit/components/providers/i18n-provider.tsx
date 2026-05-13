/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { I18nProvider } from '@ton/appkit-react';
import type { FC } from 'react';

export const I18nProviderExample: FC = () => {
    // SAMPLE_START: I18N_PROVIDER
    // Override the locale; pass `lngDicts` with your own translations when you need them.
    return (
        <I18nProvider locale="en">
            <div>My App</div>
        </I18nProvider>
    );
    // SAMPLE_END: I18N_PROVIDER
};
