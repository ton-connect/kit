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

import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { DevelopmentToolsSection, RecoveryPhraseSection, WalletInfoSection } from '@/features/settings';

const SettingsScreen: FC = () => {
    return (
        <ScreenWrapper>
            <ScreenHeader.Container>
                <ScreenHeader.Title>Settings</ScreenHeader.Title>
            </ScreenHeader.Container>

            <View style={styles.content}>
                <WalletInfoSection />
                <RecoveryPhraseSection />
                {/*<DangerZoneSection />*/}
                <DevelopmentToolsSection />
            </View>
        </ScreenWrapper>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create(({ sizes }) => ({
    content: {
        paddingVertical: sizes.space.vertical,
        gap: sizes.space.vertical * 3,
    },
}));
