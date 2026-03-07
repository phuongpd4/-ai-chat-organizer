import { AppStorage, Folder, ChatNode, BookmarkNode, DEFAULT_STATE } from '../core/types.js';

export interface IStorageRepository {
    getStorageData(): Promise<AppStorage>;
    saveFolders(folders: Folder[]): Promise<void>;
    saveChats(chats: ChatNode[]): Promise<void>;
    saveBookmarks(bookmarks: BookmarkNode[]): Promise<void>;
    onStorageChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void): () => void;
}

export class ChromeStorageRepo implements IStorageRepository {
    async getStorageData(): Promise<AppStorage> {
        return new Promise((resolve) => {
            try {
                chrome.storage.sync.get(['folders', 'chats', 'bookmarks'], (result) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[AI Chat Org] Storage Get Error:', chrome.runtime.lastError);
                        resolve(DEFAULT_STATE);
                        return;
                    }
                    resolve({
                        folders: result?.folders || DEFAULT_STATE.folders,
                        chats: result?.chats || DEFAULT_STATE.chats,
                        bookmarks: result?.bookmarks || DEFAULT_STATE.bookmarks
                    });
                });
            } catch (e) {
                console.warn('[AI Chat Org] Extension context invalidated or API unavailable:', e);
                resolve(DEFAULT_STATE);
            }
        });
    }

    async saveFolders(folders: Folder[]): Promise<void> {
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

    async saveChats(chats: ChatNode[]): Promise<void> {
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

    async saveBookmarks(bookmarks: BookmarkNode[]): Promise<void> {
        return new Promise((resolve) => {
            try {
                chrome.storage.sync.set({ bookmarks }, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('[AI Chat Org] Storage Set Bookmarks Error:', chrome.runtime.lastError);
                    }
                    resolve();
                });
            } catch (e) {
                console.warn('[AI Chat Org] Extension context invalidated:', e);
                resolve();
            }
        });
    }

    onStorageChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void): () => void {
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'sync') {
                callback(changes, areaName);
            }
        };
        try {
            chrome.storage.onChanged.addListener(listener);
        } catch (e) {
            console.warn('[AI Chat Org] Failed to add storage listener:', e);
        }
        return () => {
            try {
                chrome.storage.onChanged.removeListener(listener);
            } catch (e) {
                // ignore
            }
        };
    }
}

// Singleton export
export const storageRepo = new ChromeStorageRepo();
