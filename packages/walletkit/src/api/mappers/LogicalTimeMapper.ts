/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LogicalTime } from "../models/core/Primitives";
import { Mapper } from "./Mapper";

/**
 * Maps internal string to API LogicalTime model.
 */
export class LogicalTimeMapper extends Mapper<string, LogicalTime> {
  map(input: string): LogicalTime {
    return input;
  }
}
