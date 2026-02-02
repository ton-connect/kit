/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { breakpoints } from './breakpoints';
import { lightColors } from './colors';
import { fonts } from './fonts';
import { sizes } from './sizes';

export const lightTheme = { colors: lightColors, fonts, sizes };

export type AppBreakpoints = typeof breakpoints;
export type AppTheme = typeof lightTheme;
export interface AppThemes {
    light: AppTheme;
}
export type AppThemeName = keyof AppThemes;
