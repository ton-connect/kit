/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { sendMessage } from '@truecarry/webext-bridge/background';

import { createSendMessageToExtensionContent } from './extension';

export const SendMessageToExtensionContentFromBackground = createSendMessageToExtensionContent(sendMessage);
