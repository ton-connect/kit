/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonConnect } from '@ton/appkit';
import { createContext } from 'solid-js';

export const ConnectorContext = createContext<ITonConnect>();
