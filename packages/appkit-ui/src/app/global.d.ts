/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'solid-js';
import type { globalStylesTag } from 'src/app/styles/global-styles';

declare module 'solid-js' {
    namespace JSX {
        interface IntrinsicElements {
            [globalStylesTag]: JSX.HTMLAttributes<HTMLElement>;
        }
    }
}
