import { Folder, ChatNode, AppStorage } from '../core/types.js';
import { IStorageRepository } from '../repository/StorageRepo.js';

export class FolderUseCase {
    constructor(private storageRepo: IStorageRepository) { }

    async createFolder(appState: AppStorage): Promise<{ folders: Folder[], newFolderId: string }> {
        const newFolder: Folder = { id: `folder_${Date.now()}`, name: 'New Folder', color: '#3b82f6', createdAt: Date.now() };
        const newFolders = [...appState.folders, newFolder];
        await this.storageRepo.saveFolders(newFolders);
        return { folders: newFolders, newFolderId: newFolder.id };
    }

    async renameFolder(appState: AppStorage, folderId: string, newName: string): Promise<Folder[]> {
        const updated = appState.folders.map(f => f.id === folderId ? { ...f, name: newName } : f);
        await this.storageRepo.saveFolders(updated);
        return updated;
    }

    async deleteFolder(appState: AppStorage, folderId: string): Promise<{ folders: Folder[], chats: ChatNode[] }> {
        // Lấy tất cả thư mục con (recursive delete optional, here we just delete current and unassign child chats)
        // Để đơn giản (MVP), ta xoá thư mục đó, các sub-folder sẽ bị mồ côi (trở thành list ngoài cùng), các đoạn chat bên trong thư mục bị gỡ khỏi thư mục.
        const updatedFolders = appState.folders.filter(f => f.id !== folderId).map(f => f.parentId === folderId ? { ...f, parentId: undefined } : f);
        const updatedChats = appState.chats.map(c => c.folderId === folderId ? { ...c, folderId: undefined } : c);

        await this.storageRepo.saveFolders(updatedFolders);
        await this.storageRepo.saveChats(updatedChats);
        return { folders: updatedFolders, chats: updatedChats };
    }

    async assignFolderToFolder(appState: AppStorage, sourceFolderId: string, targetFolderId: string | undefined): Promise<Folder[]> {
        if (sourceFolderId === targetFolderId) return appState.folders;

        // Check circular dependency
        let isCircular = false;
        let currentTarget = targetFolderId;
        while (currentTarget) {
            if (currentTarget === sourceFolderId) {
                isCircular = true;
                break;
            }
            const parent = appState.folders.find(f => f.id === currentTarget)?.parentId;
            if (!parent) break;
            currentTarget = parent;
        }

        if (isCircular) return appState.folders; // Prevent infinite loop

        const updated = appState.folders.map(f => f.id === sourceFolderId ? { ...f, parentId: targetFolderId } : f);
        await this.storageRepo.saveFolders(updated);
        return updated;
    }
}
