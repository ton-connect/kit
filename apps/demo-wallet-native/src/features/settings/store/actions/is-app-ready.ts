/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSettingsStore } from '../store';

export const setIsAppReady = (isAppReady: boolean): void => {
    useSettingsStore.setState({ isAppReady });
};
