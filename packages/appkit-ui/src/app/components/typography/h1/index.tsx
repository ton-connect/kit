/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useI18n } from '@solid-primitives/i18n';
import type { Component, JSXElement } from 'solid-js';
import type { Styleable } from 'src/app/models/styleable';
import type { Translateable } from 'src/app/models/translateable';

import { H1Styled } from './style';

export interface H1Props extends Styleable, Translateable {
    children?: JSXElement;
}

export const H1: Component<H1Props> = (props) => {
    const [t] = useI18n();
    return (
        <H1Styled class={props.class} data-tc-h1="true">
            {props.translationKey
                ? t(props.translationKey, props.translationValues, props.children?.toString())
                : props.children}
        </H1Styled>
    );
};
