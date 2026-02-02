/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { FC } from 'react';
import type { TextInputProps } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { textStylesheet } from '../app-text';
import type { AppTextProps } from '../app-text';

export interface BottomSheetInputProps extends TextInputProps {
    textType?: AppTextProps['textType'];
}

export const BottomSheetInput: FC<BottomSheetInputProps> = ({ textType = 'body1', style, ...props }) => {
    const { theme } = useUnistyles();

    return (
        <BottomSheetTextInput
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
            placeholderTextColor={theme.colors.text.secondary}
            style={[textStylesheet.base, textStylesheet[textType], style]}
            {...props}
        />
    );
};

BottomSheetInput.displayName = 'BottomSheetInput';
