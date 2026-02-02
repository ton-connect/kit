/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

import type { AppToastType } from '../types/toasts';

import { sleep } from '@/core/utils/sleep';

interface UseAppToastsArgs {
    type: AppToastType;
    title: string;
    subtitle?: string;
    visibilityTime?: number;
    onPress?: () => void;
    additionalData?: {
        ticker?: string;
    };
}

interface UseAppToasts {
    toast: (args: UseAppToastsArgs) => void;
}

export const useAppToasts = (): UseAppToasts => {
    const toast = useCallback((args: UseAppToastsArgs) => {
        Toast.hide();

        void sleep(100).then(() => {
            Toast.show({
                type: args.type,
                text1: args.title,
                text2: args.subtitle,
                visibilityTime: args.visibilityTime,
                swipeable: true,
                onPress: args.onPress,
                props: args.additionalData,
            });
        });
    }, []);

    return { toast };
};
