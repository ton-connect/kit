/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationResponse } from './EmulationResponse';

/**
 * Successful outcome of a transaction emulation attempt.
 * Contains the full emulation response including trace and actions.
 */
export type EmulationResultSuccess = {
    /** Discriminant tag indicating a successful emulation */
    result: 'success';
    /** The emulation response data including trace, actions, and messages */
    emulationResult: EmulationResponse;
};

/**
 * Failed outcome of a transaction emulation attempt.
 * Contains the error code and message describing why emulation could not complete.
 */
export type EmulationResultError = {
    /** Discriminant tag indicating a failed emulation */
    result: 'error';
    /** Details of the error that caused emulation to fail */
    emulationError: EmulationError;
};

/**
 * Result of a transaction emulation attempt.
 * @discriminator result
 */
export type EmulationResult = EmulationResultSuccess | EmulationResultError;

/**
 * Error returned when transaction emulation fails.
 */
export interface EmulationError {
    /**
     * Numeric error code
     * @format int
     */
    code: number;

    /**
     * Human-readable error message
     */
    message: string;
}
