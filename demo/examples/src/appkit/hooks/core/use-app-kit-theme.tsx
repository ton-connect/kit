/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useAppKitTheme } from '@ton/appkit-react';

export const UseAppKitThemeExample = () => {
    // SAMPLE_START: USE_APP_KIT_THEME
    const [theme, setTheme] = useAppKitTheme();

    return (
        <div>
            <h3>Current Theme: {theme}</h3>
            <button onClick={() => setTheme('dark')}>Set Dark Theme</button>
            <button onClick={() => setTheme('light')}>Set Light Theme</button>
        </div>
    );
    // SAMPLE_END: USE_APP_KIT_THEME
};
