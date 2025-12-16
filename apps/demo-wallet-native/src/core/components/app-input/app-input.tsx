/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, RefObject } from 'react';
import { TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { textStylesheet } from '../app-text';
import type { AppTextProps } from '../app-text';

export interface AppInputProps extends TextInputProps {
    textType?: AppTextProps['textType'];
    ref?: RefObject<TextInput | null>;
}

export const AppInput: FC<AppInputProps> = ({ textType = 'body1', style, ref, ...props }) => {
    const { theme } = useUnistyles();

    return (
        <TextInput
            allowFontScaling={false}
            blurOnSubmit
            maxFontSizeMultiplier={1}
            placeholderTextColor={theme.colors.text.secondary}
            ref={ref}
            style={[textStylesheet.base, textStylesheet[textType], style]}
            {...props}
        />
    );
};

AppInput.displayName = 'AppInput';
