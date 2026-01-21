/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Property } from 'csstype';
type Color = Property.Color;

export type ColorsSet = {
    constant: {
        black: Color;
        white: Color;
    };
    connectButton: {
        background: Color;
        foreground: Color;
    };
    accent: Color;
    telegramButton: Color;
    icon: {
        primary: Color;
        secondary: Color;
        tertiary: Color;
        success: Color;
        error: Color;
    };
    background: {
        primary: Color;
        secondary: Color;
        segment: Color;
        tint: Color;
        qr: Color;
    };
    text: {
        primary: Color;
        secondary: Color;
    };
};

export type PartialColorsSet = {
    constant?: {
        black?: Color;
        white?: Color;
    };
    connectButton?: {
        background?: Color;
        foreground?: Color;
    };
    accent?: Color;
    telegramButton?: Color;
    icon?: {
        primary?: Color;
        secondary?: Color;
        tertiary?: Color;
        success?: Color;
        error?: Color;
    };
    background?: {
        primary?: Color;
        secondary?: Color;
        segment?: Color;
        tint?: Color;
        qr?: Color;
    };
    text?: {
        primary?: Color;
        secondary?: Color;
    };
};
