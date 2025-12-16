/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../core/Logger';
import type { AnalyticsConfig } from '../types/config';
import { Api } from './Api';

const log = globalLogger.createChild('AnalyticsApi');

export class AnalyticsApi {
    private api?: Api<unknown>;

    constructor(config?: AnalyticsConfig) {
        if (config?.enabled) {
            this.api = new Api({
                baseUrl: config?.endpoint ?? 'https://analytics.ton.org',
            });
        }
    }

    async sendEvents(events: Parameters<Api<unknown>['events']['eventsCreate']>[0]) {
        await this.api?.events.eventsCreate(events).catch(() => {
            // quit silently
        });
    }

    async sendEventsWithErrors(events: Parameters<Api<unknown>['events']['eventsCreate']>[0]) {
        await this.api?.events.eventsCreate(events).catch((error) => {
            log.info('Failed to send events', { error });
        });
    }
}
