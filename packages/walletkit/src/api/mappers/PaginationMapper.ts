/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Pagination as _Pagination } from "../../types/toncenter/Pagination";
import type { Pagination } from "../models/core/Primitives";
import { Mapper } from "./Mapper";

/**
 * Maps internal Pagination to API Pagination model.
 */
export class PaginationMapper extends Mapper<_Pagination, Pagination> {
  map(input: _Pagination): Pagination {
    return {
      limit: input.limit,
      offset: input.offset,
    };
  }
}
