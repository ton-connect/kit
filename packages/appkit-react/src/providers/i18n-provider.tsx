/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { PropsWithChildren } from 'react';
import { createContext, useState, useRef, useEffect } from 'react';

import type { Dict, I18n } from '../libs/i18n';
import { i18n, defaultLanguage } from '../libs/i18n';

/**
 * Shape returned by {@link useI18n} — current locale, translation function and helpers to switch locales or merge new dictionaries at runtime.
 *
 * @public
 * @category Type
 * @section Providers
 */
export interface I18nContextType {
    /** Currently active locale code (e.g., `"en"`, `"ru"`). */
    activeLocale: string;
    /** Translation function — accepts a key plus interpolation values and returns the localized string. */
    t: I18n['t'];
    /** Switch to a new locale; pass an optional `dict` to install translations alongside the switch. */
    locale: (lang: string, dict?: Dict) => void;
    /** Merge a translation dictionary for `lang` without changing the active locale. */
    addDict: (lang: string, dict: Dict) => void;
}

export const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Props accepted by {@link I18nProvider}.
 *
 * @public
 * @category Type
 * @section Providers
 */
export interface I18nProviderProps extends PropsWithChildren {
    /** Initial locale code; defaults to the i18n library's default when omitted. */
    locale?: string;
    /** Translation dictionaries keyed by locale; loaded into the underlying i18n instance on mount. */
    lngDicts?: Record<string, Dict>;
}

/**
 * React provider that mounts the i18n context for {@link useI18n} and child components — already wrapped by {@link AppKitProvider}, so apps usually only render it directly when they need to override the locale or dictionaries.
 *
 * @public
 * @category Component
 * @section Providers
 */
export const I18nProvider = ({ children, locale, lngDicts }: I18nProviderProps) => {
    const activeLocaleRef = useRef(locale || defaultLanguage);
    const [, setTick] = useState(0);
    const firstRender = useRef(true);

    const i18nWrapper: I18nContextType = {
        activeLocale: activeLocaleRef.current,
        t: (...args) => i18n.t(...args),
        locale: (l, dict) => {
            i18n.locale(l);
            activeLocaleRef.current = l;

            if (dict) {
                i18n.set(l, dict);
            }

            // force rerender to update view
            setTick((tick) => tick + 1);
        },
        addDict: (l, dict) => {
            i18n.set(l, dict);

            // force rerender to update view
            setTick((tick) => tick + 1);
        },
    };

    // for initial SSR render
    if (locale && firstRender.current === true) {
        firstRender.current = false;
        const dict = lngDicts?.[locale];
        i18nWrapper.locale(locale, dict);

        const restDicts = Object.entries(lngDicts || {}).filter(([l]) => l !== locale);
        restDicts.forEach(([l, dict]) => {
            i18nWrapper.addDict(l, dict);
        });
    }

    useEffect(() => {
        if (lngDicts) {
            Object.entries(lngDicts).forEach(([l, dict]) => {
                i18nWrapper.addDict(l, dict);
            });
        }
    }, [lngDicts]);

    useEffect(() => {
        if (locale) {
            i18nWrapper.locale(locale);
        }
    }, [locale]);

    return <I18nContext.Provider value={i18nWrapper}>{children}</I18nContext.Provider>;
};
