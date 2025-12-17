/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Session Manager for Extension Background Script
 *
 * Manages password session in memory (RAM) with automatic timeout.
 *
 * Security:
 * - Password stored only in memory, never persisted to storage
 * - Automatic session expiration after configurable timeout
 * - Session cleared on browser close/restart
 */

// Session configuration (0 = don't store password)
const DEFAULT_SESSION_DURATION = 60 * 1000; // 1 minute

// Session state (in memory only)
let sessionPassword: string | null = null;
let sessionTimeout: ReturnType<typeof setTimeout> | null = null;
let sessionStartTime: number | null = null;
let sessionDuration: number = DEFAULT_SESSION_DURATION;

/**
 * Clear the current session
 */
function clearSession(): void {
    sessionPassword = null;
    sessionStartTime = null;

    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
}

/**
 * Reset the session timeout (extends session on activity)
 */
function resetSessionTimeout(): void {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }

    if (sessionPassword) {
        sessionTimeout = setTimeout(() => {
            clearSession();
        }, sessionDuration);
    }
}

/**
 * Check if there's an active session
 */
function hasActiveSession(): boolean {
    if (!sessionPassword || !sessionStartTime) {
        return false;
    }

    // Check if session has expired
    const elapsed = Date.now() - sessionStartTime;
    if (elapsed >= sessionDuration) {
        clearSession();
        return false;
    }

    return true;
}

/**
 * Store password in session (call after store.unlock succeeded)
 * If sessionDuration is 0, password is not stored
 */
export function authenticate(password: string): void {
    // If duration is 0, don't store password at all
    if (sessionDuration === 0) {
        return;
    }

    sessionPassword = password;
    sessionStartTime = Date.now();
    resetSessionTimeout();
}

/**
 * Get the session password (returns null if no active session)
 * Extends session on access
 */
export function getSessionPassword(): string | null {
    if (!hasActiveSession()) {
        return null;
    }

    // Extend session on activity
    resetSessionTimeout();

    return sessionPassword;
}

/**
 * Lock the session (clear password from memory)
 */
export function lock(): void {
    clearSession();
}

/**
 * Set session duration in milliseconds (0 = don't store password)
 */
export function setSessionDuration(duration: number): void {
    sessionDuration = duration;

    // If set to 0, clear any existing session
    if (duration === 0) {
        clearSession();
    } else if (sessionPassword) {
        resetSessionTimeout();
    }
}

/**
 * Get current session duration in milliseconds
 */
export function getSessionDuration(): number {
    return sessionDuration;
}
