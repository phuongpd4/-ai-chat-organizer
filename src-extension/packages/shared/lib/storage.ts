import { Folder, ChatNode, BookmarkNode, AppStorage, DEFAULT_STATE } from '../core/types.js';
import { storageRepo } from '../repository/StorageRepo.js';

export * from '../core/types.js';

export const getStorageData = (): Promise<AppStorage> => storageRepo.getStorageData();
export const saveFolders = (folders: Folder[]): Promise<void> => storageRepo.saveFolders(folders);
export const saveChats = (chats: ChatNode[]): Promise<void> => storageRepo.saveChats(chats);
export const saveBookmarks = (bookmarks: BookmarkNode[]): Promise<void> => storageRepo.saveBookmarks(bookmarks);

export const onStorageChange = (callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) => {
    storageRepo.onStorageChange((changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'sync') callback(changes);
    });
};
