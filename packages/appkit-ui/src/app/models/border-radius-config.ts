/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BorderRadius } from 'src/models';

export type BorderRadiusConfig = Record<BorderRadius, `${number}px` | `${number}%` | `100vh` | '0'>;
