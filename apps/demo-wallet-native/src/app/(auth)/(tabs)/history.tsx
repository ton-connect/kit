/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Event } from '@ton/walletkit';
import { useCallback, useState } from 'react';
import type { FC } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ScreenHeader } from '@/core/components/screen-header';
import {
    TransactionList,
    TransactionEventRow,
    TransactionEmptyState,
    TransactionLoadingState,
    TransactionErrorState,
    TransactionDetailsModal,
    useTransactionEvents,
} from '@/features/transactions';

const HistoryScreen: FC = () => {
    const { events, isInitialLoading, isRefreshing, error, address, handleRefresh } = useTransactionEvents(20);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleEventPress = useCallback((event: Event) => {
        setSelectedEvent(event);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    const renderHeader = () => (
        <ScreenHeader.Container>
            <ScreenHeader.Title>Transactions</ScreenHeader.Title>
        </ScreenHeader.Container>
    );

    const renderContent = () => {
        if (error) {
            return <TransactionErrorState error={error} onRetry={handleRefresh} />;
        }

        if (isInitialLoading) {
            return <TransactionLoadingState />;
        }

        if (events.length === 0) {
            return <TransactionEmptyState />;
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <TransactionList<Event>
                contentContainerStyle={styles.list}
                data={events as Event[]}
                keyExtractor={(item) => item.eventId}
                ListHeaderComponent={
                    <>
                        {renderHeader()}
                        {renderContent()}
                    </>
                }
                refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
                renderItem={(event) => (
                    <TransactionEventRow
                        event={event}
                        myAddress={address || ''}
                        onPress={() => handleEventPress(event)}
                    />
                )}
            />

            <TransactionDetailsModal
                event={selectedEvent}
                myAddress={address || ''}
                visible={selectedEvent !== null}
                onClose={handleCloseModal}
            />
        </View>
    );
};

export default HistoryScreen;

const styles = StyleSheet.create(({ sizes }, runtime) => ({
    container: {
        flex: 1,
        marginTop: runtime.insets.top,
        marginLeft: runtime.insets.left,
        marginRight: runtime.insets.right,
    },
    list: {
        paddingTop: sizes.page.paddingTop,
        paddingBottom: sizes.page.paddingBottom,
        paddingHorizontal: sizes.page.paddingHorizontal,
    },
}));
