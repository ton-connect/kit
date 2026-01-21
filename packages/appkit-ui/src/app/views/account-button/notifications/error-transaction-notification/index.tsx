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

export const ErrorTransactionNotification: Component<Styleable> = (props) => {
    return (
        <Notification
            header={{ translationKey: 'notifications.transactionCanceled.header' }}
            text={{ translationKey: 'notifications.transactionCanceled.text' }}
            icon={<ErrorIconStyled size="xs" />}
            class={props.class}
            data-tc-notification-tx-cancelled="true"
        >
            Transaction cancelled
        </Notification>
    );
};
