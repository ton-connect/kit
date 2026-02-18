/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defineConfig } from 'vitest/config';
import type { ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
        exclude: ['node_modules', 'dist', 'build', 'coverage', '**/*.config.ts', '**/*.config.js'],
    },
});

export default config;
