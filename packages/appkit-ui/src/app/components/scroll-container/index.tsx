/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component, JSXElement } from 'solid-js';
import { createSignal } from 'solid-js';
import type { Styleable } from 'src/app/models/styleable';
import windowHeight from 'src/app/hooks/windowSize';
import { isMobile } from 'src/app/hooks/isMobile';

import { ScrollContainerStyled, ScrollDivider } from './style';

export interface ScrollContainerProps extends Styleable {
    children: JSXElement;
    maxHeight?: number;
}

export const ScrollContainer: Component<ScrollContainerProps> = (props) => {
    const [scrolled, setScrolled] = createSignal(false);

    const onScroll = (e: Event): void => {
        setScrolled((e.target as HTMLUListElement).scrollTop > 0);
    };

    const offset = (): number => (isMobile() ? 150 : 200);

    const maxHeight = (): string =>
        props.maxHeight !== undefined ? `${props.maxHeight}px` : `${windowHeight() - offset()}px`;

    return (
        <>
            <ScrollDivider isShown={scrolled()} />
            <ScrollContainerStyled maxHeight={maxHeight()} onScroll={onScroll} class={props.class}>
                {props.children}
            </ScrollContainerStyled>
        </>
    );
};
