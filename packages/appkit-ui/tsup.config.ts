/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'tsup';
import * as preset from 'tsup-preset-solid';

import * as packageJson from './package.json';

const presetOptions: preset.PresetOptions = {
    entries: [{ entry: 'src/index.tsx' }],
    drop_console: false,
    cjs: true,
};

export default defineConfig((config) => {
    const watching = !!config.watch;
    const parsedOptions = preset.parsePresetOptions(presetOptions, watching);

    return preset.generateTsupOptions(parsedOptions).map((options) => ({
        ...options,
        clean: true,
        sourcemap: true,
        minify: !watching,
        treeshake: {
            preset: 'smallest',
        },
        define: {
            'process.env': '{}',
            TON_APPKIT_UI_VERSION: JSON.stringify(packageJson.version),
        },
    }));
});
