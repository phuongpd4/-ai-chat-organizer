/**
 * Chrome Storage Wrapper Helper
 * Quản lý get/set các dữ liệu thư mục (Folders) và các cuộc hội thoại (Chats)
 */

export interface Folder {
    id: string;
    name: string;
    color: string;
    createdAt: number;
    parentId?: string;
}

export interface ChatNode {
    id: string; // ID của URL / Conversation
    title: string;
    url: string;
    platform: 'chatgpt' | 'claude' | 'gemini';
    folderId?: string; // Nếu thuộc về folder
    isPinned: boolean;
    createdAt: number;
}

export interface AppStorage {
    folders: Folder[];
    chats: ChatNode[];
}

const DEFAULT_STATE: AppStorage = {
    folders: [],
    chats: []
};

/**
 * Lấy toàn bộ dữ liệu storage hiện tại
 */
export async function getStorageData(): Promise<AppStorage> {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.get(['folders', 'chats'], (result) => {
                if (chrome.runtime.lastError) {
                    console.warn('[AI Chat Org] Storage Get Error:', chrome.runtime.lastError);
                    resolve(DEFAULT_STATE);
                    return;
                }
                resolve({
                    folders: result?.folders || DEFAULT_STATE.folders,
                    chats: result?.chats || DEFAULT_STATE.chats
                });
            });
        } catch (e) {
            console.warn('[AI Chat Org] Extension context invalidated or API unavailable:', e);
            resolve(DEFAULT_STATE);
        }
    });
}

/**
 * Ghi đè toàn bộ dữ liệu cho thư mục
 */
export async function saveFolders(folders: Folder[]): Promise<void> {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.set({ folders }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('[AI Chat Org] Storage Set Folders Error:', chrome.runtime.lastError);
                }
                resolve();
            });
        } catch (e) {
            console.warn('[AI Chat Org] Extension context invalidated:', e);
            resolve();
        }
    });
}

/**
 * Ghi đè toàn bộ dữ liệu danh sách chat
 */
export async function saveChats(chats: ChatNode[]): Promise<void> {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.set({ chats }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('[AI Chat Org] Storage Set Chats Error:', chrome.runtime.lastError);
                }
                resolve();
            });
        } catch (e) {
            console.warn('[AI Chat Org] Extension context invalidated:', e);
            resolve();
        }
    });
}

/**
 * Lắng nghe thay đổi storage trực tiếp (để Sync giữa Content Scripts và Background/Popup)
 */
export function onStorageChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) {
    try {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                callback(changes);
            }
        });
    } catch (e) {
        console.warn('[AI Chat Org] Failed to add storage listener:', e);
    }
}
