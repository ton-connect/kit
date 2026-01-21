/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Accessor } from 'solid-js';
import { onCleanup } from 'solid-js';

export default function clickOutside(el: Element, accessor: Accessor<() => void>): void {
    const onClick = (e: Event): void | boolean => !el.contains(e.target as Node) && accessor()?.();
    document.body.addEventListener('click', onClick);

    onCleanup(() => document.body.removeEventListener('click', onClick));
}

declare module 'solid-js' {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface Directives {
            clickOutside: () => void;
        }
    }
}
