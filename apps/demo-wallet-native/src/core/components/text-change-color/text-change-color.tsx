/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useUnistyles } from 'react-native-unistyles';

import { AppText } from '../app-text';
import type { AppTextProps } from '../app-text';

const NUMBER_REGEX = /[-+]?\d+\.?(\d+)?/;

export const TextChangeColor: FC<AppTextProps> = ({ children, style, ...props }) => {
    const { theme } = useUnistyles();

    const path = String(children).replace(/\s/g, '').match(NUMBER_REGEX);
    const int = Number(path ? path[0] : '0');

    let color: string = theme.colors.text.inactive;

    if (int > 0) color = theme.colors.success.default;

    if (int < 0) color = theme.colors.error.default;

    return (
        <AppText style={[style, { color }]} {...props}>
            {children}
        </AppText>
    );
};
