/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BackButton } from '../back-button';

export interface Props extends ViewProps {
    onCustomBackPress?: () => void;
}

export const ScreenHeaderBackButton: FC<Props> = ({ style, onCustomBackPress, ...props }) => {
    return <BackButton goBack={onCustomBackPress} style={[styles.backButton, style]} {...props} />;
};

const styles = StyleSheet.create(() => ({
    backButton: {},
}));
