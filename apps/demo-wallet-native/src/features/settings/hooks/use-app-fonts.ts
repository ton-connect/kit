/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';

export const useAppFonts = (): {
    isFontsLoaded: boolean;
    isFontsError: boolean;
} => {
    const [isFontsLoaded, isFontsError] = useFonts({
        Inter_500Medium,
        Inter_700Bold,
        Inter_600SemiBold,
    });

    return { isFontsLoaded, isFontsError: !!isFontsError };
};
