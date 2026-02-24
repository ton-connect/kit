/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Compute } from '../../types/utils';

export function filterQueryOptions<type extends object>(options: type): Compute<Omit<type, 'query'>> {
    const { query, ...rest } = options as unknown as { query: unknown };

    return rest as Compute<Omit<type, 'query'>>;
}
