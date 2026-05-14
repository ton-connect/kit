/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { SettingsButton } from '@ton/appkit-react';

export const SettingsButtonExample = () => {
    // SAMPLE_START: SETTINGS_BUTTON
    return <SettingsButton onClick={() => console.log('Open settings')} />;
    // SAMPLE_END: SETTINGS_BUTTON
};
