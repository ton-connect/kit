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
import type { Styleable } from 'src/app/models/styleable';

import { H3Styled } from './style';

export interface H3Props extends Translateable, Styleable {
    children?: JSXElement;
}

export const H3: Component<H3Props> = (props) => {
    const [t] = useI18n();

    return (
        <H3Styled data-tc-h3="true" class={props.class}>
            {props.translationKey
                ? t(props.translationKey, props.translationValues, props.children?.toString())
                : props.children}
        </H3Styled>
    );
};
