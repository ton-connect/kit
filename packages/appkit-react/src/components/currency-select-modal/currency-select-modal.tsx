/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import type { InputContainerProps } from '../ui/input';
import { Input } from '../ui/input';
import type { ModalProps } from '../ui/modal';
import { Modal } from '../ui/modal';
import { SearchIcon } from '../ui/icons';
import styles from './currency-select-modal.module.css';

export interface CurrencySelectSearchProps extends Omit<InputContainerProps, 'children'> {
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
}

export const CurrencySelectSearch: FC<CurrencySelectSearchProps> = ({
    searchValue,
    onSearchChange,
    placeholder,
    className,
    ...props
}) => {
    return (
        <Input.Container size="s" className={clsx(styles.searchWrapper, className)} {...props}>
            <Input.Field>
                <Input.Slot>
                    <SearchIcon size={24} />
                </Input.Slot>

                <Input.Input
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoFocus
                />
            </Input.Field>
        </Input.Container>
    );
};

export interface CurrencySelectListContainerProps extends ComponentProps<'div'> {
    isEmpty: boolean;
}

export const CurrencySelectListContainer: FC<CurrencySelectListContainerProps> = ({
    isEmpty,
    children,
    className,
    ...props
}) => {
    return (
        <div className={clsx(styles.list, className)} {...props}>
            {isEmpty ? (
                <div className={styles.empty}>
                    <p className={styles.emptyText}>We didn&#x27;t find any tokens.</p>
                    <p className={styles.emptyText}>Try searching by address.</p>
                </div>
            ) : (
                children
            )}
        </div>
    );
};

export const CurrencySelectSectionHeader: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.sectionHeader, className)} {...props}>
        {children}
    </p>
);

export const CurrencySelectSection: FC<ComponentProps<'div'>> = ({ className, children, ...props }) => (
    <div className={clsx(styles.section, className)} {...props}>
        {children}
    </div>
);

export const CurrencySelectModal: FC<ModalProps> = ({ className, ...props }) => {
    return <Modal className={clsx(styles.body, className)} {...props} />;
};

export const CurrencySelect = {
    Modal: CurrencySelectModal,
    Search: CurrencySelectSearch,
    ListContainer: CurrencySelectListContainer,
    SectionHeader: CurrencySelectSectionHeader,
    Section: CurrencySelectSection,
};
