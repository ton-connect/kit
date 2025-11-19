/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import browser from 'webextension-polyfill';
import { sendMessage } from 'webext-bridge/popup';
import { ExtensionStorageAdapter } from '@ton/walletkit';

import { createSendMessageToExtensionContent } from './extension';

export const SendMessageToExtensionContent = createSendMessageToExtensionContent(sendMessage);

export function CreateExtensionStorageAdapter() {
    return new ExtensionStorageAdapter({}, browser.storage.local);
}
