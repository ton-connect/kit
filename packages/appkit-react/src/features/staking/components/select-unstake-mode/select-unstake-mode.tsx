/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useMemo, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';
import { UnstakeMode } from '@ton/appkit';
import type { UnstakeModes, StakingProviderInfo, StakingProviderMetadata } from '@ton/appkit';

import { Collapsible } from '../../../../components/ui/collapsible';
import { ChevronDownIcon } from '../../../../components/ui/icons';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { formatAmount } from '../staking-info/utils';
import styles from './select-unstake-mode.module.css';

/**
 * Props accepted by {@link SelectUnstakeMode}.
 *
 * @public
 * @category Type
 * @section Staking
 */
export interface SelectUnstakeModeProps extends ComponentProps<'div'> {
    /** Currently selected unstake mode (see {@link appkit:UnstakeMode}). */
    value: UnstakeModes;
    /** Called when the user picks a different mode. */
    onValueChange: (mode: UnstakeModes) => void;
    /** Dynamic provider info — used to show the instant-unstake limit when available. */
    providerInfo: StakingProviderInfo | undefined;
    /** Static provider metadata — supplies `supportedUnstakeModes` and stake-token formatting. */
    providerMetadata: StakingProviderMetadata | undefined;
}

interface ModeOption {
    value: UnstakeModes;
    label: string;
    tags: string[];
}

/**
 * Collapsible selector for the unstake mode (instant / round-end / when-available). Filters options by `providerMetadata.supportedUnstakeModes` and renders nothing when only one mode is supported. Annotates the instant option with the provider's current instant-unstake limit.
 *
 * @sample docs/examples/src/appkit/components/staking#SELECT_UNSTAKE_MODE
 *
 * @public
 * @category Component
 * @section Staking
 */
export const SelectUnstakeMode: FC<SelectUnstakeModeProps> = ({
    value,
    onValueChange,
    providerInfo,
    providerMetadata,
    className,
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const { t } = useI18n();

    const instantLimit = useMemo(() => {
        if (!providerInfo?.instantUnstakeAvailable) return undefined;
        const limit = `${formatAmount(providerInfo.instantUnstakeAvailable, providerMetadata?.stakeToken.decimals)} ${providerMetadata?.stakeToken.ticker}`;
        return t('staking.instantLimit', { limit });
    }, [providerInfo, providerMetadata, t]);

    const modes: ModeOption[] = useMemo(
        () =>
            [
                {
                    value: UnstakeMode.INSTANT,
                    label: t('staking.instant'),
                    tags: instantLimit ? [instantLimit] : [],
                },
                {
                    value: UnstakeMode.ROUND_END,
                    label: t('staking.maximumReward'),
                    tags: [t('staking.maximumRewardLimit')],
                },
                {
                    value: UnstakeMode.WHEN_AVAILABLE,
                    label: t('staking.whenAvailable'),
                    tags: [t('staking.whenAvailableLimit')],
                },
            ].filter((m) =>
                providerMetadata?.supportedUnstakeModes
                    ? providerMetadata?.supportedUnstakeModes.includes(m.value)
                    : true,
            ),
        [t, instantLimit, providerMetadata?.supportedUnstakeModes],
    );

    const selectedLabel = modes.find((m) => m.value === value)?.label ?? '';

    const handleSelect = useCallback((mode: UnstakeModes) => onValueChange(mode), [onValueChange]);

    if (modes.length === 1) {
        return null;
    }

    return (
        <div className={clsx(styles.root, className)} {...props}>
            <button type="button" className={styles.header} onClick={() => setOpen((v) => !v)}>
                <span className={styles.headerLabel}>{t('staking.unstakeType')}</span>
                <span className={styles.headerValue}>
                    {selectedLabel}
                    <ChevronDownIcon size={16} className={clsx(styles.chevron, open && styles.chevronOpen)} />
                </span>
            </button>

            <Collapsible open={open}>
                <div className={styles.options}>
                    {modes.map((mode) => {
                        const isActive = value === mode.value;
                        return (
                            <div
                                key={mode.value}
                                className={styles.option}
                                onClick={() => handleSelect(mode.value)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={styles.optionRow}>
                                    <span className={clsx(styles.radio, isActive && styles.radioActive)}>
                                        <span className={clsx(styles.point, isActive && styles.pointActive)} />
                                    </span>
                                    <span className={styles.optionLabel}>{mode.label}</span>

                                    <div className={styles.tags}>
                                        {mode.tags.map((tag) => (
                                            <span key={tag} className={styles.tag}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Collapsible>
        </div>
    );
};
