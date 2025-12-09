/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DAppInfo as _DAppInfo } from "../../types/events";
import type { DAppInfo } from "../models/core/DAppInfo";
import { Mapper } from "./Mapper";

/**
 * Maps internal DAppInfo to API DAppInfo model.
 */
export class DAppInfoMapper extends Mapper<_DAppInfo, DAppInfo> {
  map(input: _DAppInfo): DAppInfo {
    return {
      name: input.name,
      description: input.description,
      url: input.url,
      iconUrl: input.iconUrl,
    };
  }
}
