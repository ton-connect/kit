/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component, JSXElement } from 'solid-js';
import { Show } from 'solid-js';
import { H3 } from 'src/app/components';
import type { Styleable } from 'src/app/models/styleable';
import type { Translateable } from 'src/app/models/translateable';
import type { PropertyRequired } from 'src/app/utils/types';
import { useDataAttributes } from 'src/app/hooks/use-data-attributes';
import type { WithDataAttributes } from 'src/app/models/with-data-attributes';

import { NotificationContentStyled, NotificationStyled, TextStyled } from './style';

export interface NotificationProps extends Styleable, WithDataAttributes {
    header: PropertyRequired<Translateable, 'translationKey'>;
    children?: string;
    text?: Translateable;
    icon?: JSXElement;
}

export const Notification: Component<NotificationProps> = (props) => {
    const dataAttrs = useDataAttributes(props);

    return (
        <NotificationStyled class={props.class} data-tc-notification="true" {...dataAttrs}>
            <NotificationContentStyled>
                <H3 translationKey={props.header.translationKey} translationValues={props.header.translationValues}>
                    {props.children}
                </H3>
                <Show when={props.text}>
                    <TextStyled
                        translationKey={props.text!.translationKey}
                        translationValues={props.text!.translationValues}
                    />
                </Show>
            </NotificationContentStyled>
            {props.icon}
        </NotificationStyled>
    );
};
