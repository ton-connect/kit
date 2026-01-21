/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { THEME, Theme } from 'src/models/THEME';
import type { BorderRadius } from 'src/models/border-radius';
import type { PartialColorsSet } from 'src/models/colors-set';

export interface UIPreferences {
    /**
     * Color theme for the UI elements.
     * @default SYSTEM theme.
     */
    theme?: Theme;

    /**
     * Border radius for UI elements.
     * @default 'm'
     */
    borderRadius?: BorderRadius;

    /**
     * Configure colors scheme for different themes.
     */
    colorsSet?: Partial<Record<THEME, PartialColorsSet>>;
}
