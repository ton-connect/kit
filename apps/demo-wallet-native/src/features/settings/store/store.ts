/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { create } from 'zustand/react';

export interface SettingsState {
    isAppReady: boolean;
}

export const useSettingsStore = create<SettingsState>(() => ({
    isAppReady: false,
}));
