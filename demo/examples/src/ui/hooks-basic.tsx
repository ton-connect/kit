/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useAppKitTheme, useSelectedWallet } from '@ton/appkit-ui-react';

export const UsageExample = () => {
    const [theme, setTheme] = useAppKitTheme();
    const [selectedWallet] = useSelectedWallet();

    const toggleTheme = () => {
        setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    };

    return (
        <div>
            <h1>AppKit Status</h1>
            <p>Connected: {selectedWallet ? 'Yes' : 'No'}</p>
            <p>Theme: {theme}</p>
            <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
    );
};
