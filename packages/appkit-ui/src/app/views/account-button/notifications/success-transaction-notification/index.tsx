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
import { SuccessIconStyled } from 'src/app/views/account-button/notifications/success-transaction-notification/style';

export const SuccessTransactionNotification: Component<Styleable> = (props) => {
    return (
        <Notification
            header={{ translationKey: 'notifications.transactionSent.header' }}
            text={{ translationKey: 'notifications.transactionSent.text' }}
            icon={<SuccessIconStyled />}
            class={props.class}
            data-tc-notification-tx-sent="true"
        >
            Transaction sent
        </Notification>
    );
};
