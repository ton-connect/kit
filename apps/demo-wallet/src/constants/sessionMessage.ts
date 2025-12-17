/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Message types for communication between popup and background
export const SESSION_MESSAGE_TYPES = {
    AUTHENTICATE: 'SESSION_AUTHENTICATE',
    GET_PASSWORD: 'SESSION_GET_PASSWORD',
    LOCK: 'SESSION_LOCK',
    SET_DURATION: 'SESSION_SET_DURATION',
    GET_DURATION: 'SESSION_GET_DURATION',
} as const;
