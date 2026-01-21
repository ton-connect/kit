/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createSignal } from 'solid-js';
import { getWindow } from 'src/app/utils/web-api';

const [windowHeight, setWindowHeight] = createSignal(getWindow()?.innerHeight || 0);

if (getWindow()) {
    window.addEventListener('resize', () => setWindowHeight(window.innerHeight));
}

export default windowHeight;
