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
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
        globals: true,
        environment: 'node',
        include: ['src/**/*.integration.spec.ts'],
        reporter: ['verbose'],
    },
});

export default config;
