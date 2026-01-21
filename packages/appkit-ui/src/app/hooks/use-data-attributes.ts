/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { splitProps, untrack } from 'solid-js';
import type { WithDataAttributes } from 'src/app/models/with-data-attributes';

export function useDataAttributes<T extends object>(props: T): WithDataAttributes {
    const keys = untrack(() => Object.keys(props).filter((key) => key.startsWith('data-')));
    const [dataAttrs] = splitProps(props, keys as (keyof T)[]);
    return dataAttrs;
}
