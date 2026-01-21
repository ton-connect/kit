/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { Notification } from 'src/app/components/notification';
import type { Styleable } from 'src/app/models/styleable';

import { ErrorIconStyled } from './style';

export const ErrorSignDataNotification: Component<Styleable> = (props) => {
    return (
        <Notification
            header={{ translationKey: 'notifications.signDataCanceled.header' }}
            icon={<ErrorIconStyled size="xs" />}
            class={props.class}
            data-tc-notification-sign-data-cancelled="true"
        >
            Sign data canceled
        </Notification>
    );
};
