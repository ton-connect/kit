/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { sendMessage } from '@truecarry/webext-bridge/background';

import { JS_BRIDGE_MESSAGE_TO_CONTENT } from './constants';

import { createComponentLogger } from '@/utils/logger';

const log = createComponentLogger('Extension');

type SendMessageFunction = typeof sendMessage;

export function createSendMessageToExtensionContent(
    sendMessage: SendMessageFunction,
): (sessionId: string, message: unknown) => Promise<void> {
    return async (sessionId: string, message: unknown): Promise<void> => {
        if (typeof message !== 'object' || message === null || !('type' in message)) {
            return;
        }
        try {
            await sendMessage(
                JS_BRIDGE_MESSAGE_TO_CONTENT,
                JSON.parse(JSON.stringify({ message })),
                `window@${sessionId}`,
            );
        } catch (error) {
            log.error('Failed to send JSBRIDGE_MESSAGE:', error);
        }
    };
}
