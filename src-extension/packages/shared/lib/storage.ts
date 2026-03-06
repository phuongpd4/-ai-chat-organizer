/**
 * Chrome Storage Wrapper Helper
 * Quản lý get/set các dữ liệu thư mục (Folders) và các cuộc hội thoại (Chats)
 */

export interface Folder {
    id: string;
    name: string;
    color: string;
    createdAt: number;
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
        chrome.storage.sync.get(['folders', 'chats'], (result) => {
            resolve({
                folders: result.folders || DEFAULT_STATE.folders,
                chats: result.chats || DEFAULT_STATE.chats
            });
        });
    });
}

/**
 * Ghi đè toàn bộ dữ liệu cho thư mục
 */
export async function saveFolders(folders: Folder[]): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ folders }, () => resolve());
    });
}

/**
 * Ghi đè toàn bộ dữ liệu danh sách chat
 */
export async function saveChats(chats: ChatNode[]): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ chats }, () => resolve());
    });
}

/**
 * Lắng nghe thay đổi storage trực tiếp (để Sync giữa Content Scripts và Background/Popup)
 */
export function onStorageChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
            callback(changes);
        }
    });
}
