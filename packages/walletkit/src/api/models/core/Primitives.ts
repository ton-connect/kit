/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * User-friendly TON address representation (e.g., "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2")
 */
export type UserFriendlyAddress = string;

/**
 * Hexadecimal string representation (e.g., "0x0a1b2c3d...")
 */
export type Hex = string;

/**
 * Base64-encoded string representation
 */
export type Base64String = string;

/**
 * Logical time value used for ordering transactions on the TON blockchain
 */
export type LogicalTime = string;

/**
 * Generic result status for operations.
 */
export enum Result {
  /**
   * Operation completed successfully
   */
  success = "success",
  /**
   * Operation failed
   */
  failure = "failure",
}

/**
 * Error information returned when an operation fails.
 */
export interface ResultError {
  /**
   * Error code representing the type of error
   * @format int
   */
  code?: number;

  /**
   * Human-readable error message
   */
  message?: string;

  /**
   * Additional error data
   */
  data?: { [key: string]: unknown };
}

export interface Pagination {
  /**
   * Maximum number of items to return
   * @format int
   */
  limit?: number;

  /**
   * Number of items to skip before starting to collect the result set
   * @format int
   */
  offset?: number;
}
