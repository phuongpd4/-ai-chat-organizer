/**
 * Theme configuration cho AI Chat Organizer
 * Lưu trữ và đọc theme từ chrome.storage.sync
 */

export interface ThemeColors {
    bg: string;
    bgSecondary: string;
    bgHover: string;
    bgInput: string;
    border: string;
    borderFocus: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textHeading: string;
    accent: string;
    accentHover: string;
    danger: string;
    badge: string;
    dropdown: string;
    dropdownBorder: string;
    dropdownHover: string;
    shadow: string;
    indicator: string;
}

export const darkTheme: ThemeColors = {
    bg: '#0c0c0e',
    bgSecondary: '#141418',
    bgHover: '#1c1c22',
    bgInput: '#141418',
    border: '#1f2937',
    borderFocus: '#10b981',
    text: '#d1d5db',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    textHeading: '#ffffff',
    accent: '#10b981',
    accentHover: '#059669',
    danger: '#ef4444',
    badge: '#1f2937',
    dropdown: '#1c1c22',
    dropdownBorder: '#2d2d35',
    dropdownHover: '#2d2d35',
    shadow: 'rgba(0,0,0,0.4)',
    indicator: '#4b5563',
};

export const lightTheme: ThemeColors = {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    bgHover: '#f3f4f6',
    bgInput: '#f9fafb',
    border: '#e5e7eb',
    borderFocus: '#10b981',
    text: '#374151',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    textHeading: '#111827',
    accent: '#10b981',
    accentHover: '#059669',
    danger: '#ef4444',
    badge: '#e5e7eb',
    dropdown: '#ffffff',
    dropdownBorder: '#e5e7eb',
    dropdownHover: '#f3f4f6',
    shadow: 'rgba(0,0,0,0.1)',
    indicator: '#d1d5db',
};

export type ThemeMode = 'dark' | 'light';

export function getTheme(mode: ThemeMode): ThemeColors {
    return mode === 'light' ? lightTheme : darkTheme;
}

export async function getSavedTheme(): Promise<ThemeMode> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['themeMode'], (result) => {
            resolve(result.themeMode === 'light' ? 'light' : 'dark');
        });
    });
}

export async function saveTheme(mode: ThemeMode): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ themeMode: mode }, () => resolve());
    });
}
