/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { router } from 'expo-router';
import type { FC } from 'react';
import { Dimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useWallet } from '@ton/demo-core';

import { AppButton } from '@/core/components/app-button';
import { ScreenHeader } from '@/core/components/screen-header';
import { ScreenWrapper } from '@/core/components/screen-wrapper';
import { AddressQrcode } from '@/features/wallets';

const ReceiveAddressScreen: FC = () => {
    const { address } = useWallet();

    const handleBack = (): void => {
        if (router.canGoBack()) router.back();
    };

    return (
        <ScreenWrapper contentContainerStyle={styles.innerContainer}>
            <ScreenHeader.Container>
                <ScreenHeader.LeftSide>
                    <ScreenHeader.BackButton />
                </ScreenHeader.LeftSide>

                <ScreenHeader.Title>Address</ScreenHeader.Title>
            </ScreenHeader.Container>

            <AddressQrcode address={address || ''} style={styles.depositAddress} />

            <AppButton.Container onPress={handleBack} style={styles.buttonContainer}>
                <AppButton.Text>Close</AppButton.Text>
            </AppButton.Container>
        </ScreenWrapper>
    );
};

export default ReceiveAddressScreen;

const styles = StyleSheet.create(({ sizes }, runtime) => ({
    innerContainer: {
        minHeight: Dimensions.get('window').height - runtime.insets.top - runtime.insets.bottom,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
        paddingHorizontal: sizes.page.paddingHorizontal,
        paddingTop: sizes.page.paddingTop,
        paddingBottom: runtime.insets.bottom + sizes.page.paddingBottom,
    },
    loader: {
        marginTop: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    depositAddress: {
        marginBottom: 30,
    },
    buttonContainer: {
        marginTop: 'auto',
    },
    errorContainer: {
        flex: 1,
    },
    statusBlock: {
        height: '80%',
        paddingVertical: 64,
        marginBottom: 20,
    },
    statusSubtitle: {
        marginBottom: 0,
    },
}));
