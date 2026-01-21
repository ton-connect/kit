/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import original module declarations
import 'solid-styled-components';
import type { THEME } from 'src/app/models/THEME';
import type { ColorsSet } from 'src/models/colors-set';
import type { BorderRadius } from 'src/models/border-radius';

declare module 'solid-styled-components' {
    export interface DefaultTheme {
        theme: THEME;

        colors: ColorsSet;

        borderRadius: BorderRadius;
    }
}
