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

import { Collapsible } from '../../../../components/collapsible';
import { useI18n } from '../../../settings/hooks/use-i18n';
import { formatAmount } from '../staking-info/utils';
import styles from './select-unstake-mode.module.css';

export interface SelectUnstakeModeProps extends ComponentProps<'div'> {
    value: UnstakeModes;
    onValueChange: (mode: UnstakeModes) => void;
    providerInfo: StakingProviderInfo | undefined;
    providerMetadata: StakingProviderMetadata | undefined;
}

interface ModeOption {
    value: UnstakeModes;
    label: string;
    tags: string[];
}

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
        () => [
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
        ],
        [t, instantLimit],
    );

    const selectedLabel = modes.find((m) => m.value === value)?.label ?? '';

    const handleSelect = useCallback((mode: UnstakeModes) => onValueChange(mode), [onValueChange]);

    return (
        <div className={clsx(styles.root, className)} {...props}>
            <button type="button" className={styles.header} onClick={() => setOpen((v) => !v)}>
                <span className={styles.headerLabel}>{t('staking.unstakeType')}</span>
                <span className={styles.headerValue}>
                    {selectedLabel}
                    <svg
                        className={clsx(styles.chevron, open && styles.chevronOpen)}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
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
