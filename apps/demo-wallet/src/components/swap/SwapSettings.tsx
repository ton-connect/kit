/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useState, useEffect } from 'react';

import { Button } from '../Button';
import { Modal } from '../Modal';

interface SwapSettingsProps {
    slippageBps: number;
    setSlippageBps: (slippage: number) => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
}

export const SwapSettings: FC<SwapSettingsProps> = ({ slippageBps, setSlippageBps }) => {
    const [open, setOpen] = useState(false);
    const [tempSlippageBps, setTempSlippageBps] = useState(slippageBps);

    const presetSlippages = [50, 100, 300, 500];

    useEffect(() => {
        setTempSlippageBps(slippageBps);
    }, [slippageBps]);

    const handleSave = () => {
        if (tempSlippageBps >= 10 && tempSlippageBps <= 5000) {
            setSlippageBps(tempSlippageBps);
        }
        setOpen(false);
    };

    const handleCancel = () => {
        setTempSlippageBps(slippageBps);
        setOpen(false);
    };

    return (
        <>
            <button
                className="w-8 h-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded-md"
                onClick={() => setOpen(true)}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            </button>

            <Modal.Container isOpen={open} onClose={handleCancel}>
                <Modal.Header onClose={handleCancel}>
                    <Modal.Title>Swap Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body className="space-y-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Slippage Tolerance</label>
                        <div className="grid grid-cols-4 gap-2">
                            {presetSlippages.map((preset) => (
                                <button
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                                        tempSlippageBps === preset
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    key={preset}
                                    onClick={() => setTempSlippageBps(preset)}
                                >
                                    {preset / 100}%
                                </button>
                            ))}
                        </div>
                        <p className="text-gray-500 text-xs">
                            Your transaction will revert if the price changes unfavorably by more than this percentage.
                        </p>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleCancel} variant="secondary">
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal.Container>
        </>
    );
};
