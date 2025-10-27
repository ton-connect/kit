/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface HoldToSignButtonProps {
    onComplete: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    holdDuration?: number; // Duration in milliseconds
    className?: string;
}

export const HoldToSignButton: React.FC<HoldToSignButtonProps> = ({
    onComplete,
    disabled = false,
    isLoading = false,
    holdDuration = 3000,
    className = '',
}) => {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [showRipples, setShowRipples] = useState(false);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const clearTimers = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const handleHoldStart = useCallback(() => {
        if (disabled || isLoading || isComplete) return;

        setIsHolding(true);
        setShowRipples(true);
        startTimeRef.current = Date.now();

        // Progress update interval (60fps)
        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
            setProgress(newProgress);
        }, 16);

        // Completion timer
        holdTimerRef.current = setTimeout(() => {
            setIsComplete(true);
            setProgress(100);
            clearTimers();

            // Add a small delay for the completion animation
            setTimeout(() => {
                onComplete();
            }, 300);
        }, holdDuration);
    }, [disabled, isLoading, isComplete, holdDuration, onComplete, clearTimers]);

    const handleHoldEnd = useCallback(() => {
        if (isComplete) return;

        setIsHolding(false);
        setShowRipples(false);
        clearTimers();

        // Smoothly animate progress back to 0
        const currentProgress = progress;
        const steps = 10;
        const stepDuration = 100 / steps;
        let step = 0;

        const resetInterval = setInterval(() => {
            step++;
            const newProgress = currentProgress * (1 - step / steps);
            setProgress(newProgress);

            if (step >= steps) {
                clearInterval(resetInterval);
                setProgress(0);
            }
        }, stepDuration);
    }, [isComplete, progress, clearTimers]);

    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, [clearTimers]);

    const buttonClasses = `
        relative flex-1 px-4 py-3 rounded-lg font-medium text-white
        overflow-hidden transition-all duration-300 select-none
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isComplete ? 'bg-green-600' : isHolding ? 'bg-blue-700 scale-[0.98]' : 'bg-blue-600 hover:bg-blue-700'}
        ${className}
    `;

    return (
        <button
            className={buttonClasses}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            disabled={disabled || isLoading}
        >
            {/* Ripple effects */}
            {showRipples && !isComplete && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                                     rounded-full border-2 border-white/30"
                            style={{
                                animation: `ripple 1.5s ease-out infinite`,
                                animationDelay: `${i * 0.5}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Progress bar background */}
            <div
                className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 
                           opacity-0 transition-opacity duration-300"
                style={{
                    opacity: isHolding ? 0.3 : 0,
                }}
            />

            {/* Animated progress bar */}
            <div
                className="absolute inset-0 transition-all ease-linear"
                style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    width: isComplete ? '100%' : `${progress}%`,
                    transitionDuration: isComplete ? '0ms' : '100ms',
                    boxShadow: isHolding ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none',
                }}
            />

            {/* Shimmer effect */}
            {isHolding && !isComplete && (
                <div
                    className="absolute inset-0 -translate-x-full"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        animation: 'shimmer 1s infinite',
                    }}
                />
            )}

            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="inline-block min-w-[110px] text-center">Processing...</span>
                    </>
                ) : isComplete ? (
                    <>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="inline-block min-w-[110px] text-center">Signed!</span>
                    </>
                ) : (
                    <>
                        <svg
                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isHolding ? 'scale-110' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                        </svg>
                        <span className="font-semibold inline-block min-w-[110px] text-center">
                            {isHolding
                                ? `Hold (${Math.ceil((holdDuration - (progress * holdDuration) / 100) / 1000)}s)`
                                : 'Hold to Sign'}
                        </span>
                    </>
                )}
            </div>

            <style>{`
                @keyframes ripple {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 1;
                    }
                    100% {
                        width: 300px;
                        height: 300px;
                        opacity: 0;
                    }
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(200%);
                    }
                }
            `}</style>
        </button>
    );
};
