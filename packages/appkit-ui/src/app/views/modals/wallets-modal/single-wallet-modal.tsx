/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectAdditionalRequest } from '@ton/appkit';
import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, onCleanup, Show, useContext } from 'solid-js';
import { ConnectorContext } from 'src/app/state/connector.context';
import { getSingleWalletModalIsOpened, getSingleWalletModalWalletInfo } from 'src/app/state/modals-state';
import { useI18n } from '@solid-primitives/i18n';
import { appState } from 'src/app/state/app.state';
import { isMobile, updateIsMobile } from 'src/app/hooks/isMobile';
import { LoaderIcon } from 'src/app/components';
import type { LoadableReady } from 'src/models/loadable';
import { DesktopConnectionModal } from 'src/app/views/modals/wallets-modal/desktop-connection-modal';
import { InfoModal } from 'src/app/views/modals/wallets-modal/info-modal';
import { MobileConnectionModal } from 'src/app/views/modals/wallets-modal/mobile-connection-modal';
import { Dynamic } from 'solid-js/web';
import type { WalletsModalCloseReason } from 'src/models';
import { TonConnectUiContext } from 'src/app/state/ton-connect-ui.context';

import { H1Styled, LoaderContainerStyled, StyledModal } from './style';

export const SingleWalletModal: Component = () => {
    const { locale } = useI18n()[1];
    createEffect(() => locale(appState.language));

    createEffect(() => {
        if (getSingleWalletModalIsOpened()) {
            updateIsMobile();
        }
    });

    const connector = useContext(ConnectorContext)!;
    const tonConnectUI = useContext(TonConnectUiContext)!;
    const [infoTab, setInfoTab] = createSignal(false);

    const additionalRequestLoading = (): boolean => appState.connectRequestParameters?.state === 'loading';

    const additionalRequest = createMemo(() => {
        if (additionalRequestLoading()) {
            return undefined;
        }

        return (appState.connectRequestParameters as LoadableReady<ConnectAdditionalRequest>)?.value;
    });

    const onClose = (closeReason: WalletsModalCloseReason): void => {
        tonConnectUI.closeSingleWalletModal(closeReason);
    };

    const unsubscribe = connector.onStatusChange((wallet) => {
        if (wallet) {
            onClose('wallet-selected');
        }
    });

    onCleanup(unsubscribe);

    onCleanup(() => {
        setInfoTab(false);
    });

    return (
        <StyledModal
            opened={getSingleWalletModalIsOpened()}
            enableAndroidBackHandler={appState.enableAndroidBackHandler}
            onClose={() => onClose('action-cancelled')}
            onClickQuestion={() => setInfoTab((v) => !v)}
            showFooter={true}
            data-tc-wallets-modal-container="true"
        >
            <Show when={infoTab()}>
                <InfoModal onBackClick={() => setInfoTab(false)} />
            </Show>

            <Show when={!infoTab()}>
                <Show when={additionalRequestLoading()}>
                    <H1Styled translationKey="walletModal.loading">Wallets list is loading</H1Styled>
                    <LoaderContainerStyled>
                        <LoaderIcon size="m" />
                    </LoaderContainerStyled>
                </Show>

                <Show when={!additionalRequestLoading()}>
                    <Dynamic
                        component={isMobile() ? MobileConnectionModal : DesktopConnectionModal}
                        wallet={getSingleWalletModalWalletInfo()!} // TODO: remove non-null assertion
                        additionalRequest={additionalRequest()}
                        onBackClick={() => {}}
                        backDisabled={true}
                    />
                </Show>
            </Show>
        </StyledModal>
    );
};
