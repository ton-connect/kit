/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from '@tamagui/core';

import { animations } from './animations';
import { bodyFont, headingFont } from './fonts';

export const config = createTamagui({
    ...defaultConfig,
    animations,
    fonts: {
        body: bodyFont,
        heading: headingFont,
    },
    settings: {
        ...defaultConfig.settings,
        onlyAllowShorthands: false,
    },
});
