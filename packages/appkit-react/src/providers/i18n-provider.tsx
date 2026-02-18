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

export interface I18nContextType {
    activeLocale: string;
    t: I18n['t'];
    locale: (lang: string, dict?: Dict) => void;
    addDict: (lang: string, dict: Dict) => void;
}

export const I18nContext = createContext<I18nContextType | null>(null);

export interface I18nProviderProps extends PropsWithChildren {
    locale?: string;
    lngDicts?: Record<string, Dict>;
}

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
