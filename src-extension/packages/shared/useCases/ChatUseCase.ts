import { ChatNode, AppStorage, BookmarkNode } from '../core/types.js';
import { IStorageRepository } from '../repository/StorageRepo.js';

export class ChatUseCase {
    constructor(private storageRepo: IStorageRepository) { }

    async assignToFolder(appState: AppStorage, allChats: ChatNode[], chatId: string, folderId: string | undefined): Promise<ChatNode[]> {
        let updatedChats = [...appState.chats];
        const idx = updatedChats.findIndex(c => c.id === chatId);
        if (idx >= 0) {
            updatedChats[idx] = { ...updatedChats[idx], folderId };
        } else {
            const native = allChats.find(c => c.id === chatId);
            if (native) updatedChats.push({ ...native, folderId });
        }
        await this.storageRepo.saveChats(updatedChats);
        return updatedChats;
    }

    async togglePin(appState: AppStorage, allChats: ChatNode[], chatId: string): Promise<ChatNode[]> {
        let updatedChats = [...appState.chats];
        const idx = updatedChats.findIndex(c => c.id === chatId);
        if (idx >= 0) {
            updatedChats[idx] = { ...updatedChats[idx], isPinned: !updatedChats[idx].isPinned };
        } else {
            const native = allChats.find(c => c.id === chatId);
            if (native) updatedChats.push({ ...native, isPinned: true });
        }
        await this.storageRepo.saveChats(updatedChats);
        return updatedChats;
    }

    async deleteBookmark(appState: AppStorage, bookmarkId: string): Promise<BookmarkNode[]> {
        const updatedBookmarks = appState.bookmarks.filter(b => b.id !== bookmarkId);
        await this.storageRepo.saveBookmarks(updatedBookmarks);
        return updatedBookmarks;
    }
}
