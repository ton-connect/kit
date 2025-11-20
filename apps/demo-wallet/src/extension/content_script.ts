/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { allowWindowMessaging } from '@truecarry/webext-bridge/content-script';

import { JS_BRIDGE_NAMESPACE } from '@/lib/constants';

allowWindowMessaging(JS_BRIDGE_NAMESPACE);
