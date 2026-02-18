/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';

import { I18nContext } from '../providers/i18n-provider';

export const useI18n = () => {
    const i18n = useContext(I18nContext);

    if (!i18n) {
        throw new Error('useI18n must be used within an I18nProvider');
    }

    return i18n;
};
