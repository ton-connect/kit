/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, RefObject } from 'react';
import type { ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

interface Props extends KeyboardAwareScrollViewProps {
    ref?: RefObject<ScrollView>;
}

export const AppKeyboardAwareScrollView: FC<Props> = (props) => (
    <KeyboardAwareScrollView showsVerticalScrollIndicator={false} {...props} />
);

AppKeyboardAwareScrollView.displayName = 'AppKeyboardAwareScrollView';
