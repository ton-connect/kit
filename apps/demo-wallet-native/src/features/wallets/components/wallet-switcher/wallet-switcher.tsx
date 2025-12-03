/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ionicons } from '@expo/vector-icons';
import type { SavedWallet } from '@ton/demo-core';
import { router } from 'expo-router';
import { type FC, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ActiveTouchAction } from '@/core/components/active-touch-action';
import { AppText } from '@/core/components/app-text';
import { Block } from '@/core/components/block';

interface WalletSwitcherProps {
    savedWallets: SavedWallet[];
    activeWalletId?: string;
    onSwitchWallet: (walletId: string) => void;
    onRemoveWallet: (walletId: string) => void;
    onRenameWallet: (walletId: string, newName: string) => void;
}

export const WalletSwitcher: FC<WalletSwitcherProps> = ({
    savedWallets,
    activeWalletId,
    onSwitchWallet,
    onRemoveWallet,
    onRenameWallet,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [showDetailsWalletId, setShowDetailsWalletId] = useState<string | null>(null);

    const { theme } = useUnistyles();

    const activeWallet = savedWallets.find((w) => w.id === activeWalletId);

    const handleStartEdit = (wallet: SavedWallet) => {
        setEditingWalletId(wallet.id);
        setEditingName(wallet.name);
    };

    const handleSaveEdit = () => {
        if (editingWalletId && editingName.trim()) {
            onRenameWallet(editingWalletId, editingName.trim());
            setEditingWalletId(null);
            setEditingName('');
        }
    };

    const handleCancelEdit = () => {
        setEditingWalletId(null);
        setEditingName('');
    };

    const handleRemove = (walletId: string) => {
        Alert.alert('Remove Wallet', 'Are you sure you want to remove this wallet? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    onRemoveWallet(walletId);
                    if (savedWallets.length <= 1) {
                        setIsExpanded(false);
                    }
                },
            },
        ]);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    const formatWalletType = (type: string) => {
        const typeMap: Record<string, string> = {
            mnemonic: 'Mnemonic',
            signer: 'Signer',
            ledger: 'Ledger Hardware',
        };
        return typeMap[type] || type;
    };

    if (savedWallets.length === 0) {
        return null;
    }

    return (
        <Block style={styles.container}>
            {/* Active Wallet Display */}
            <ActiveTouchAction onPress={() => setIsExpanded(!isExpanded)} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Ionicons color={theme.colors.primary} name="wallet-outline" size={20} />
                    </View>
                    <View style={styles.headerText}>
                        <AppText style={styles.walletName} textType="body1">
                            {activeWallet?.name || 'No Wallet Selected'}
                        </AppText>
                        <AppText style={styles.walletAddress} textType="caption1">
                            {activeWallet ? formatAddress(activeWallet.address) : 'Select a wallet'}
                        </AppText>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {savedWallets.length > 1 && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.background.secondary }]}>
                            <AppText style={styles.badgeText} textType="caption2">
                                {savedWallets.length} wallets
                            </AppText>
                        </View>
                    )}
                    <Ionicons
                        color={theme.colors.text.secondary}
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                    />
                </View>
            </ActiveTouchAction>

            {/* Wallet List */}
            {isExpanded && (
                <View style={styles.listContainer}>
                    <ScrollView style={styles.scrollView}>
                        {savedWallets.map((wallet) => {
                            const isActive = wallet.id === activeWalletId;
                            const isEditing = editingWalletId === wallet.id;

                            return (
                                <View
                                    key={wallet.id}
                                    style={[
                                        styles.walletItem,
                                        isActive && {
                                            backgroundColor: theme.colors.primary + '10',
                                        },
                                    ]}
                                >
                                    <View style={styles.walletItemContent}>
                                        {isEditing ? (
                                            <View style={styles.editContainer}>
                                                <TextInput
                                                    autoFocus
                                                    onChangeText={setEditingName}
                                                    placeholder="Wallet name"
                                                    style={[
                                                        styles.editInput,
                                                        {
                                                            color: theme.colors.text.primary,
                                                            borderColor: theme.colors.border,
                                                        },
                                                    ]}
                                                    value={editingName}
                                                />
                                                <View style={styles.editButtons}>
                                                    <ActiveTouchAction
                                                        onPress={handleSaveEdit}
                                                        style={styles.editButton}
                                                    >
                                                        <Ionicons
                                                            color={theme.colors.success.foreground}
                                                            name="checkmark"
                                                            size={16}
                                                        />
                                                    </ActiveTouchAction>
                                                    <ActiveTouchAction
                                                        onPress={handleCancelEdit}
                                                        style={styles.editButton}
                                                    >
                                                        <Ionicons
                                                            color={theme.colors.text.secondary}
                                                            name="close"
                                                            size={16}
                                                        />
                                                    </ActiveTouchAction>
                                                </View>
                                            </View>
                                        ) : (
                                            <>
                                                <View style={styles.walletInfo}>
                                                    <View style={styles.walletNameRow}>
                                                        <AppText style={styles.itemName} textType="body1">
                                                            {wallet.name}
                                                        </AppText>
                                                        {isActive && (
                                                            <View
                                                                style={[
                                                                    styles.activeBadge,
                                                                    { backgroundColor: theme.colors.primary },
                                                                ]}
                                                            >
                                                                <AppText
                                                                    style={[
                                                                        styles.activeBadgeText,
                                                                        { color: theme.colors.buttonPrimary.color },
                                                                    ]}
                                                                    textType="caption2"
                                                                >
                                                                    Active
                                                                </AppText>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <AppText style={styles.itemAddress} textType="caption1">
                                                        {formatAddress(wallet.address)}
                                                    </AppText>
                                                    <View style={styles.walletMeta}>
                                                        <ActiveTouchAction
                                                            onPress={() =>
                                                                setShowDetailsWalletId(
                                                                    showDetailsWalletId === wallet.id
                                                                        ? null
                                                                        : wallet.id,
                                                                )
                                                            }
                                                            style={styles.metaButton}
                                                        >
                                                            <AppText style={styles.metaText} textType="caption2">
                                                                {formatWalletType(wallet.walletInterfaceType)}
                                                            </AppText>
                                                            <Ionicons
                                                                color={theme.colors.text.tertiary}
                                                                name={
                                                                    showDetailsWalletId === wallet.id
                                                                        ? 'chevron-up'
                                                                        : 'chevron-down'
                                                                }
                                                                size={12}
                                                            />
                                                        </ActiveTouchAction>
                                                        <AppText style={styles.metaText} textType="caption2">
                                                            •
                                                        </AppText>
                                                        <AppText style={styles.metaText} textType="caption2">
                                                            Created {formatDate(wallet.createdAt)}
                                                        </AppText>
                                                    </View>

                                                    {/* Wallet Details */}
                                                    {showDetailsWalletId === wallet.id && (
                                                        <View
                                                            style={[
                                                                styles.detailsContainer,
                                                                { borderTopColor: theme.colors.border },
                                                            ]}
                                                        >
                                                            <View style={styles.detailRow}>
                                                                <AppText style={styles.detailLabel} textType="caption1">
                                                                    Interface Type:
                                                                </AppText>
                                                                <View
                                                                    style={[
                                                                        styles.detailBadge,
                                                                        {
                                                                            backgroundColor:
                                                                                theme.colors.background.secondary,
                                                                        },
                                                                    ]}
                                                                >
                                                                    <AppText
                                                                        style={styles.detailValue}
                                                                        textType="caption2"
                                                                    >
                                                                        {formatWalletType(wallet.walletInterfaceType)}
                                                                    </AppText>
                                                                </View>
                                                            </View>
                                                            {wallet.ledgerConfig && (
                                                                <View style={styles.detailRow}>
                                                                    <AppText
                                                                        style={styles.detailLabel}
                                                                        textType="caption1"
                                                                    >
                                                                        Ledger Account:
                                                                    </AppText>
                                                                    <View
                                                                        style={[
                                                                            styles.detailBadge,
                                                                            {
                                                                                backgroundColor:
                                                                                    theme.colors.background.secondary,
                                                                            },
                                                                        ]}
                                                                    >
                                                                        <AppText
                                                                            style={styles.detailValue}
                                                                            textType="caption2"
                                                                        >
                                                                            #{wallet.ledgerConfig.accountIndex}
                                                                        </AppText>
                                                                    </View>
                                                                </View>
                                                            )}
                                                            <View style={styles.fullAddressContainer}>
                                                                <AppText style={styles.detailLabel} textType="caption1">
                                                                    Full Address:
                                                                </AppText>
                                                                <View
                                                                    style={[
                                                                        styles.fullAddressBox,
                                                                        {
                                                                            backgroundColor:
                                                                                theme.colors.background.secondary,
                                                                        },
                                                                    ]}
                                                                >
                                                                    <AppText
                                                                        style={styles.fullAddressText}
                                                                        textType="caption2"
                                                                    >
                                                                        {wallet.address}
                                                                    </AppText>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={styles.actions}>
                                                    {!isActive && (
                                                        <ActiveTouchAction
                                                            onPress={() => onSwitchWallet(wallet.id)}
                                                            style={styles.actionButton}
                                                        >
                                                            <Ionicons
                                                                color={theme.colors.primary}
                                                                name="swap-horizontal"
                                                                size={18}
                                                            />
                                                        </ActiveTouchAction>
                                                    )}
                                                    <ActiveTouchAction
                                                        onPress={() => handleStartEdit(wallet)}
                                                        style={styles.actionButton}
                                                    >
                                                        <Ionicons
                                                            color={theme.colors.text.secondary}
                                                            name="pencil-outline"
                                                            size={18}
                                                        />
                                                    </ActiveTouchAction>
                                                    <ActiveTouchAction
                                                        onPress={() => handleRemove(wallet.id)}
                                                        style={styles.actionButton}
                                                    >
                                                        <Ionicons
                                                            color={theme.colors.error.foreground}
                                                            name="trash-outline"
                                                            size={18}
                                                        />
                                                    </ActiveTouchAction>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Add New Wallet Button */}
                    <View style={[styles.footer, { backgroundColor: theme.colors.background.secondary }]}>
                        <ActiveTouchAction onPress={() => router.push('/(non-auth)/start')} style={styles.addButton}>
                            <Ionicons color={theme.colors.primary} name="add-circle-outline" size={20} />
                            <AppText style={[styles.addButtonText, { color: theme.colors.primary }]} textType="body2">
                                Add New Wallet
                            </AppText>
                        </ActiveTouchAction>
                    </View>
                </View>
            )}
        </Block>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    walletName: {
        fontWeight: '600',
        marginBottom: 2,
    },
    walletAddress: {
        color: theme.colors.text.secondary,
        fontFamily: 'monospace',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: theme.colors.text.secondary,
    },
    listContainer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    scrollView: {
        maxHeight: 400,
    },
    walletItem: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    walletItemContent: {
        flexDirection: 'row',
        padding: 12,
    },
    walletInfo: {
        flex: 1,
    },
    walletNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    itemName: {
        fontWeight: '600',
    },
    activeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    itemAddress: {
        color: theme.colors.text.secondary,
        fontFamily: 'monospace',
        marginBottom: 6,
    },
    walletMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: theme.colors.text.tertiary,
    },
    detailsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailLabel: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    detailBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    detailValue: {
        color: theme.colors.text.secondary,
    },
    fullAddressContainer: {
        gap: 6,
    },
    fullAddressBox: {
        padding: 8,
        borderRadius: 8,
    },
    fullAddressText: {
        color: theme.colors.text.secondary,
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionButton: {
        padding: 6,
    },
    editContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },
    editButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 6,
    },
    footer: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addButtonText: {
        fontWeight: '600',
    },
}));
