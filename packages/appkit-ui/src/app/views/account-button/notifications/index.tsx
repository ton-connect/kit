/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Component } from 'solid-js';
import { For, Match, Switch } from 'solid-js';
import { TransitionGroup } from 'solid-transition-group';
import type { Styleable } from 'src/app/models/styleable';
import { useOpenedNotifications } from 'src/app/hooks/use-notifications';
import { animate } from 'src/app/utils/animate';

import { ConfirmOperationNotification } from './confirm-operation-notification';
import { ErrorTransactionNotification } from './error-transaction-notification';
import { SuccessTransactionNotification } from './success-transaction-notification';
import { NotificationClass } from './style';
import { ErrorSignDataNotification } from './error-sign-data-notification';
import { SuccessSignDataNotification } from './success-sign-data-notification';

export const Notifications: Component<Styleable> = (props) => {
    const openedNotifications = useOpenedNotifications();

    return (
        <div class={props.class} data-tc-list-notifications="true">
            <TransitionGroup
                onBeforeEnter={(el) => {
                    animate(
                        el,
                        [
                            { opacity: 0, transform: 'translateY(0)' },
                            { opacity: 1, transform: 'translateY(-8px)' },
                        ],
                        {
                            duration: 200,
                        },
                    );
                }}
                onExit={(el, done) => {
                    const a = animate(
                        el,
                        [
                            { opacity: 1, transform: 'translateY(-8px)' },
                            { opacity: 0, transform: 'translateY(-30px)' },
                        ],
                        {
                            duration: 200,
                        },
                    );
                    a.finished.then(done);
                }}
            >
                <For each={openedNotifications()}>
                    {(openedNotification) => (
                        <Switch>
                            <Match when={openedNotification.action === 'transaction-sent'}>
                                <SuccessTransactionNotification class={NotificationClass} />
                            </Match>
                            <Match when={openedNotification.action === 'transaction-canceled'}>
                                <ErrorTransactionNotification class={NotificationClass} />
                            </Match>
                            <Match when={openedNotification.action === 'data-signed'}>
                                <SuccessSignDataNotification class={NotificationClass} />
                            </Match>
                            <Match when={openedNotification.action === 'sign-data-canceled'}>
                                <ErrorSignDataNotification class={NotificationClass} />
                            </Match>
                            <Match
                                when={
                                    openedNotification.action === 'confirm-transaction' ||
                                    openedNotification.action === 'confirm-sign-data'
                                }
                            >
                                <ConfirmOperationNotification class={NotificationClass} />
                            </Match>
                        </Switch>
                    )}
                </For>
            </TransitionGroup>
        </div>
    );
};
