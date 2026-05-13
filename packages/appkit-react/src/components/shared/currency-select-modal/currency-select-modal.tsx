/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import type { InputContainerProps } from '../../ui/input';
import { Input } from '../../ui/input';
import type { ModalProps } from '../../ui/modal';
import { Modal } from '../../ui/modal';
import { SearchIcon } from '../../ui/icons';
import styles from './currency-select-modal.module.css';

/**
 * Props accepted by {@link CurrencySelect.Search}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface CurrencySelectSearchProps extends Omit<InputContainerProps, 'children'> {
    /** Current search query. */
    searchValue: string;
    /** Called whenever the user types in the search input. */
    onSearchChange: (value: string) => void;
    /** Placeholder text shown when the input is empty. */
    placeholder?: string;
}

/**
 * Search input row for the {@link CurrencySelect.Modal} — auto-focuses on mount and shows a magnifier icon.
 *
 * @public
 * @category Component
 * @section Shared
 */
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

/**
 * Props accepted by {@link CurrencySelect.ListContainer}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface CurrencySelectListContainerProps extends ComponentProps<'div'> {
    /** When true, renders the built-in empty state instead of `children`. */
    isEmpty: boolean;
}

/**
 * Scrollable list area for {@link CurrencySelect.Modal} content. Swaps `children` for a built-in empty state when `isEmpty` is true.
 *
 * @public
 * @category Component
 * @section Shared
 */
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

/**
 * Section header label rendered at the top of a {@link CurrencySelect.Section}.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CurrencySelectSectionHeader: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.sectionHeader, className)} {...props}>
        {children}
    </p>
);

/**
 * Container for a group of currency rows inside {@link CurrencySelect.ListContainer}.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CurrencySelectSection: FC<ComponentProps<'div'>> = ({ className, children, ...props }) => (
    <div className={clsx(styles.section, className)} {...props}>
        {children}
    </div>
);

/**
 * Underlying {@link Modal} with currency-select styling — the same `open` / `onOpenChange` / `title` props as the standard modal.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CurrencySelectModal: FC<ModalProps> = ({ className, ...props }) => {
    return <Modal className={clsx(styles.body, className)} {...props} />;
};

/**
 * Compound currency-select primitives — compose {@link CurrencySelect.Modal} with a {@link CurrencySelect.Search} and {@link CurrencySelect.ListContainer} of {@link CurrencySelect.Section} rows to build a custom token picker. For a ready-made implementation see {@link TokenSelectModal}.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CurrencySelect = {
    /** Modal wrapper. */
    Modal: CurrencySelectModal,
    /** Auto-focused search input row. */
    Search: CurrencySelectSearch,
    /** Scrollable list area with built-in empty state. */
    ListContainer: CurrencySelectListContainer,
    /** Header label rendered above a section. */
    SectionHeader: CurrencySelectSectionHeader,
    /** Container for a group of currency rows. */
    Section: CurrencySelectSection,
};
