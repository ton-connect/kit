/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { useContext } from 'solid-js';
import { Notification } from 'src/app/components/notification';
import type { Styleable } from 'src/app/models/styleable';
import { LoaderIconStyled } from 'src/app/views/account-button/notifications/confirm-operation-notification/style';
import { TonConnectUiContext } from 'src/app/state/ton-connect-ui.context';
import { useI18n } from '@solid-primitives/i18n';

export const ConfirmOperationNotification: Component<Styleable> = (props) => {
    const tonConnectUI = useContext(TonConnectUiContext);
    const [t] = useI18n();
    const name = (): string =>
        tonConnectUI!.wallet && 'name' in tonConnectUI!.wallet
            ? tonConnectUI!.wallet.name
            : t('common.yourWallet', {}, 'Your wallet');

    return (
        <Notification
            header={{
                translationKey: 'notifications.confirm.header',
                translationValues: { name: name() },
            }}
            class={props.class}
            icon={<LoaderIconStyled />}
            data-tc-notification-confirm="true"
        >
            Confirm operation in your wallet
        </Notification>
    );
};
