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
    highlightIndices?: readonly [number, number][]; // Lưu vị trí từ khóa tìm kiếm
}

export interface BookmarkNode {
    id: string;
    chatId: string;
    textExcerpt: string;
    url: string;
    createdAt: number;
}

export interface AppStorage {
    folders: Folder[];
    chats: ChatNode[];
    bookmarks: BookmarkNode[];
}

export const DEFAULT_STATE: AppStorage = {
    folders: [],
    chats: [],
    bookmarks: []
};
