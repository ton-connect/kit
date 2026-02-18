/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import rosetta from 'rosetta';

import en from '../locales/en';

export const i18n = rosetta({ en });
export { en };
export const defaultLanguage = 'en';

i18n.locale(defaultLanguage);

export type I18n = typeof i18n;
export type Dict = typeof en;
