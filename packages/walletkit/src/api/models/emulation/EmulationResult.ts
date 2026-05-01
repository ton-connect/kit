/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmulationResponse } from './EmulationResponse';

/**
 * Result of a transaction emulation attempt.
 * @discriminator result
 */
export type EmulationResult =
    | {
          /** Emulation completed successfully */
          result: 'success';
          /** The emulation response data */
          emulationResult: EmulationResponse;
      }
    | {
          /** Emulation failed */
          result: 'error';
          /** Error details */
          emulationError: EmulationError;
      };

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
