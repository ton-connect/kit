/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Base64String } from "./Primitives";

/**
 * Data to be signed by the wallet, discriminated by type.
 */
export type SignData =
  | { type: "text"; value: SignDataText }
  | { type: "binary"; value: SignDataBinary }
  | { type: "cell"; value: SignDataCell };

/**
 * Binary data to be signed.
 */
export interface SignDataBinary {
  /**
   * Raw binary content encoded as bytes in Base64
   */
  content: Base64String;
}

/**
 * TON Cell data to be signed with a schema definition.
 */
export interface SignDataCell {
  /**
   * Schema describing the cell structure for parsing
   */
  schema: string;
  /**
   * Cell content encoded in Base64
   */
  content: Base64String;
}

/**
 * Plain text data to be signed.
 */
export interface SignDataText {
  /**
   * Text content to be signed
   */
  content: string;
}
