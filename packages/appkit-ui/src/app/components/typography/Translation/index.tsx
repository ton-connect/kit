/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useI18n } from '@solid-primitives/i18n';
import type { Component, JSXElement } from 'solid-js';
import type { Translateable } from 'src/app/models/translateable';
import type { PropertyRequired } from 'src/app/utils/types';

interface TranslationProps extends PropertyRequired<Translateable, 'translationKey'> {
    children?: JSXElement;
}

export const Translation: Component<TranslationProps> = (props) => {
    const [t] = useI18n();

    return <>{t(props.translationKey, props.translationValues, props.children?.toString())}</>;
};
