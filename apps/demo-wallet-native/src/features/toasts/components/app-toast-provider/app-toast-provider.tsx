/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useUnistyles } from 'react-native-unistyles';

import type { AppToastConfig } from '../../types/toasts';
import { AppToast } from '../app-toast';

import { useSettingsStore } from '@/features/settings';

const getToastConfig = (): AppToastConfig => ({
    loading: (toast) => <AppToast {...toast} />,
    success: (toast) => <AppToast {...toast} />,
    error: (toast) => <AppToast {...toast} />,
    info: (toast) => <AppToast {...toast} />,
});

export const AppToastProvider = (): React.JSX.Element => {
    const isAppReady = useSettingsStore((state) => state.isAppReady);

    const { theme } = useUnistyles();
    const { top, bottom } = useSafeAreaInsets();

    return (
        <Toast
            bottomOffset={bottom}
            config={getToastConfig()}
            key={isAppReady ? 'ready' : 'setting-up'}
            position="top"
            topOffset={top + theme.sizes.space.vertical}
            visibilityTime={1500}
        />
    );
};

export const ModalToastProvider = (): React.JSX.Element => {
    const isAppReady = useSettingsStore((state) => state.isAppReady);

    const { theme } = useUnistyles();

    return (
        <Toast
            bottomOffset={theme.sizes.space.vertical}
            config={getToastConfig()}
            key={isAppReady ? 'ready' : 'setting-up'}
            position="top"
            topOffset={theme.sizes.space.vertical}
            visibilityTime={1500}
        />
    );
};
