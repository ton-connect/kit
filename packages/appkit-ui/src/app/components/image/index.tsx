/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';
import type { Styleable } from 'src/app/models/styleable';

import { ImagePlaceholder } from './style';

export interface ImageProps extends Styleable {
    src: string;
    alt?: string;
}

export const Image: Component<ImageProps> = (props) => {
    let imgRef: HTMLImageElement | undefined;

    const [image, setImage] = createSignal<HTMLImageElement | null>(null);

    createEffect(() => {
        const img = new window.Image();
        img.src = props.src;
        img.alt = props.alt || '';
        img.setAttribute('draggable', 'false');
        if (props.class) {
            img.classList.add(props.class);
        }

        if (img.complete) {
            return setImage(img);
        }

        img.addEventListener('load', () => setImage(img));

        return () => img.removeEventListener('load', () => setImage(img));
    });

    return (
        <>
            <Show when={image()}>{image()}</Show>
            <Show when={!image()}>
                <ImagePlaceholder class={props.class} ref={imgRef} />
            </Show>
        </>
    );
};
