/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StyleSheet } from 'react-native-unistyles';

import { breakpoints } from '../configs/theme/breakpoints';
import { lightTheme } from '../configs/theme/themes';
import type { AppBreakpoints, AppThemes } from '../configs/theme/themes';

declare module 'react-native-unistyles' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface UnistylesBreakpoints extends AppBreakpoints {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
    settings: {
        initialTheme: 'light',
    },
    breakpoints,
    themes: {
        light: lightTheme,
    },
});
