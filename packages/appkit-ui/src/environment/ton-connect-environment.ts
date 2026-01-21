/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IEnvironment } from '@ton/appkit';
import { getUserAgent } from 'src/app/utils/web-api';
import { getTgUser, isInTMA } from 'src/app/utils/tma-api';

export class TonConnectEnvironment implements IEnvironment {
    userAgent = getUserAgent();

    getLocale() {
        return navigator.languages?.[0] || navigator.language || '';
    }
    getBrowser() {
        return this.userAgent.browser ?? '';
    }
    getPlatform() {
        return this.userAgent.os ?? '';
    }
    getTelegramUser() {
        return getTgUser();
    }
    getClientEnvironment() {
        return isInTMA() ? 'miniapp' : 'web';
    }
}
