/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component, JSXElement } from 'solid-js';
import type { Styleable } from 'src/app/models/styleable';

import { AStyled } from './style';

export interface LinkProps extends Styleable {
    children: JSXElement;

    href: string;

    blank?: boolean;
}

export const Link: Component<LinkProps> = (props) => {
    const attributes = (): { rel: 'noreferrer noopener' } | object =>
        props.blank ? { rel: 'noreferrer noopener' } : {};

    return (
        <AStyled href={props.href} target={props.blank ? '_blank' : '_self'} class={props.class} {...attributes}>
            {props.children}
        </AStyled>
    );
};
