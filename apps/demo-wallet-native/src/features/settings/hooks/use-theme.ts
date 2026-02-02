/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { setBackgroundColorAsync } from 'expo-navigation-bar';
import { useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';

const activeTheme: string = 'light';

export const useTheme = (): boolean => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        Appearance.setColorScheme(activeTheme === 'dark' ? 'dark' : 'light');
    }, []);

    useEffect(() => {
        // https://docs.expo.dev/tutorial/configuration/#configure-the-status-bar
        setTimeout(() => {
            if (Platform.OS === 'android') {
                void setBackgroundColorAsync('transparent')
                    .then(() => setIsReady(true))
                    .catch(() => setIsReady(true));
            } else {
                setIsReady(true);
            }
        }, 0);
    }, []);

    return isReady;
};
