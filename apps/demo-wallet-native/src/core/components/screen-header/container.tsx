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

import { Row } from '../grid';

interface Props extends ViewProps {
    type?: 'screen' | 'modal';
}

export const ScreenHeaderContainer: FC<Props> = ({ style, type = 'screen', ...props }) => {
    return (
        <Row
            style={[styles.container, type === 'screen' && styles.screen, type === 'modal' && styles.modal, style]}
            {...props}
        />
    );
};

const styles = StyleSheet.create(({ sizes }) => ({
    container: {
        position: 'relative',
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: sizes.space.vertical,
    },
    screen: {},
    modal: {
        marginTop: sizes.page.paddingTop * 2,
        marginHorizontal: sizes.page.paddingHorizontal,
    },
}));
