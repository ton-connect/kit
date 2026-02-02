/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Text } from 'react-native';
import type { TextProps } from 'react-native';

import { textStylesheet } from './styles';

export interface AppTextProps extends TextProps {
    textType?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body1' | 'body2' | 'caption1' | 'caption2' | 'caption3';
}

export const AppText: FC<AppTextProps> = ({ style, textType = 'body1', ...props }) => {
    return (
        <Text
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
            style={[textStylesheet.base, textStylesheet[textType], style]}
            {...props}
        />
    );
};
