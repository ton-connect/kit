/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from "../models/core/Primitives";
import { Mapper } from "./Mapper";

/**
 * Maps internal string to API Hex model.
 * Checks if string is hex (with or without 0x prefix) and normalizes it.
 */
export class HexMapper extends Mapper<string, Hex> {
  map(input: string): Hex {
    // Remove 0x prefix if exists for uniform checking
    const normalized = input.startsWith("0x") ? input.slice(2) : input;

    // Check if it's a valid non-empty hex string
    if (normalized.length > 0 && /^[0-9a-fA-F]+$/.test(normalized)) {
      return `0x${normalized.toLowerCase()}`;
    }

    // Not a valid hex string, convert from UTF-8
    const hex = Buffer.from(input, "utf-8").toString("hex").toLowerCase();
    return `0x${hex}`;
  }
}
