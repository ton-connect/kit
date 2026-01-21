/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Accessor } from 'solid-js';
import { onCleanup } from 'solid-js';

export default function escPressed(_: Element, accessor: Accessor<() => void>): void {
    const onKeyPress = (e: Event): void | boolean => {
        if ((e as KeyboardEvent).key === 'Escape') {
            (document.activeElement as HTMLElement)?.blur();
            accessor()?.();
        }
    };
    document.body.addEventListener('keydown', onKeyPress);

    onCleanup(() => document.body.removeEventListener('keydown', onKeyPress));
}

declare module 'solid-js' {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface Directives {
            keyPressed: () => void;
        }
    }
}
