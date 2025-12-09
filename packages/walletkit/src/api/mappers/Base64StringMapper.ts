/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from "../models/core/Primitives";
import { Mapper } from "./Mapper";

// Base64 regex pattern
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Maps internal string to API Base64String model.
 * Checks if string is already in base64 format, converts if not.
 */
export class Base64StringMapper extends Mapper<string, Base64String> {
  map(input: string): Base64String {
    // Check if already in base64 format
    if (BASE64_REGEX.test(input) && input.length % 4 === 0) {
      return input;
    }
    // Convert to base64 format
    return Buffer.from(input, "utf-8").toString("base64");
  }
}
