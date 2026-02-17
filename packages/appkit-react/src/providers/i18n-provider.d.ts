/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { PropsWithChildren } from 'react';
import type { Dict, I18n } from '../libs/i18n';
export interface I18nContextType {
    activeLocale: string;
    t: I18n['t'];
    locale: (lang: string, dict?: Dict) => void;
    addDict: (lang: string, dict: Dict) => void;
}
export declare const I18nContext: import("react").Context<I18nContextType | null>;
export interface I18nProviderProps extends PropsWithChildren {
    locale?: string;
    lngDicts?: Record<string, Dict>;
}
export declare const I18nProvider: ({ children, locale, lngDicts }: I18nProviderProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=i18n-provider.d.ts.map