/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component, JSXElement } from 'solid-js';
import { Image } from 'src/app/components';
import { styled } from 'solid-styled-components';
import type { Styleable } from 'src/app/models/styleable';

export interface WalletImageProps extends Styleable {
    src: string;
    badge?: JSXElement;
}

const ImageContainer = styled.div`
    position: relative;

    &::after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        border: 0.5px solid rgba(0, 0, 0, 0.08);
        border-radius: inherit;
    }
`;

export const ImageStyled = styled(Image)`
    width: 100%;
    height: 100%;
    border-radius: inherit;
`;

export const WalletImage: Component<WalletImageProps> = (props) => {
    return (
        <ImageContainer class={props.class}>
            <ImageStyled src={props.src} />
            {props.badge}
        </ImageContainer>
    );
};
