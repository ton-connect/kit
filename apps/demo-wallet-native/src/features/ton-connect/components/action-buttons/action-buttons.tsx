/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppButton } from '@/core/components/app-button';

interface ActionButtonsProps {
    primaryText: string;
    secondaryText?: string;
    onPrimaryPress: () => void;
    onSecondaryPress: () => void;
    isLoading?: boolean;
    isPrimaryDisabled?: boolean;
    primaryTestID?: string;
    secondaryTestID?: string;
}

export const ActionButtons: FC<ActionButtonsProps> = ({
    primaryText,
    secondaryText = 'Reject',
    onPrimaryPress,
    onSecondaryPress,
    isLoading = false,
    isPrimaryDisabled = false,
    primaryTestID,
    secondaryTestID,
}) => {
    return (
        <View style={styles.actions}>
            <AppButton.Container
                testID={primaryTestID}
                onPress={onPrimaryPress}
                disabled={isLoading || isPrimaryDisabled}
                style={styles.button}
            >
                <AppButton.Text>{primaryText}</AppButton.Text>
            </AppButton.Container>

            <AppButton.Container
                testID={secondaryTestID}
                colorScheme="secondary"
                onPress={onSecondaryPress}
                disabled={isLoading}
                style={styles.button}
            >
                <AppButton.Text>{secondaryText}</AppButton.Text>
            </AppButton.Container>
        </View>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    actions: {
        gap: sizes.space.horizontal / 2,
    },
    button: {
        flex: 1,
    },
}));
