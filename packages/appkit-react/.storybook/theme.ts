/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'storybook/theming';

export default create({
    base: 'dark',

    // Branding
    brandTitle: 'TON AppKit',
    brandUrl: 'https://github.com/ton-connect/kit',
    brandImage: 'ton.svg',
    brandTarget: '_self',

    // Colors
    colorPrimary: '#0098EA',
    colorSecondary: '#0098EA',

    // UI
    appBg: '#121214',
    appContentBg: '#1E1E1E',
    appPreviewBg: '#121214',
    appBorderColor: '#2C2C2C',
    appBorderRadius: 8,

    // Typography
    fontBase:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    fontCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

    // Text colors
    textColor: '#FFFFFF',
    textInverseColor: '#121214',

    // Toolbar default and active colors
    barTextColor: '#909DAB',
    barSelectedColor: '#0098EA',
    barHoverColor: '#FFFFFF',
    barBg: '#121214',

    // Form colors
    inputBg: '#1E1E1E',
    inputBorder: '#2C2C2C',
    inputTextColor: '#FFFFFF',
    inputBorderRadius: 8,
});
