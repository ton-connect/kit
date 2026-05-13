/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';

import { I18nContext } from '../../../providers/i18n-provider';

/**
 * Read the i18n context published by {@link I18nProvider} (or the wrapping {@link AppKitProvider}). Returns the active locale, translation function and helpers to switch locales or merge dictionaries. Throws when rendered outside the provider tree.
 *
 * @returns The i18n context ({@link I18nContextType}) with `activeLocale`, `t`, `locale` and `addDict`.
 *
 * @public
 * @category Hook
 * @section Settings
 */
export const useI18n = () => {
    const i18n = useContext(I18nContext);

    if (!i18n) {
        throw new Error('useI18n must be used within an I18nProvider');
    }

    return i18n;
};
