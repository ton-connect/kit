/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonConnect } from '@ton/appkit';
import { createEffect } from 'solid-js';
import type { Action } from 'src/app/state/modals-state';
import { action } from 'src/app/state/modals-state';

interface TransactionModalManagerCreateOptions {
    /**
     * TonConnect instance.
     */
    connector: ITonConnect;
}

/**
 * Manages the transaction modal window state.
 */
export class TransactionModalManager {
    /**
     * TonConnect instance.
     * @internal
     */
    private readonly connector: ITonConnect;

    /**
     * List of subscribers to the modal window state changes.
     * @internal
     */
    private consumers: Array<(action: Action | null) => void> = [];

    constructor(options: TransactionModalManagerCreateOptions) {
        this.connector = options.connector;

        createEffect(() => {
            const currentAction = action();
            this.consumers.forEach((consumer) => consumer(currentAction));
        });
    }

    /**
     * Subscribe to the modal window state changes, returns unsubscribe function.
     */
    public onStateChange(consumer: (action: Action | null) => void): () => void {
        this.consumers.push(consumer);

        return () => {
            this.consumers = this.consumers.filter((c) => c !== consumer);
        };
    }
}
