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

import { LedgerInstructions } from '../ledger-instructions';

import { AppButton } from '@/core/components/app-button';

interface Props {
    onStartScan: () => void;
}

export const InstructionsStep: FC<Props> = ({ onStartScan }) => {
    return (
        <>
            <LedgerInstructions />
            <View style={styles.buttonContainer}>
                <AppButton.Container colorScheme="primary" onPress={onStartScan}>
                    <AppButton.Text>Start Scanning</AppButton.Text>
                </AppButton.Container>
            </View>
        </>
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    buttonContainer: {
        marginTop: sizes.space.vertical,
    },
}));
