import { useState, useEffect, useMemo } from 'react';
import { AppStorage, ChatNode } from '../core/types.js'; // Wait type from theme
import { storageRepo } from '../repository/StorageRepo.js';
import { ExportUseCase } from '../useCases/ExportUseCase.js';
import { FolderUseCase } from '../useCases/FolderUseCase.js';
import { ChatUseCase } from '../useCases/ChatUseCase.js';
import { getTheme, getSavedTheme, saveTheme, ThemeMode, ThemeColors } from '../lib/theme.js';
import { useDOMObserver } from './useDOMObserver.js';

export function useAppViewModel() {
    const [appState, setAppState] = useState<AppStorage | null>(null);
    const [searchResults, setSearchResults] = useState<ChatNode[] | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['system_bookmarks']));
    const [assigningChatId, setAssigningChatId] = useState<string | null>(null);
    const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    const nativeChats = useDOMObserver();
    const t = getTheme(themeMode);

    const folderUseCase = useMemo(() => new FolderUseCase(storageRepo), []);
    const chatUseCase = useMemo(() => new ChatUseCase(storageRepo), []);

    useEffect(() => {
        storageRepo.getStorageData().then(setAppState);
        getSavedTheme().then(setThemeMode);

        const cleanup = storageRepo.onStorageChange((changes, areaName) => {
            if (areaName !== 'sync') return;
            if (changes.themeMode) {
                setThemeMode(changes.themeMode.newValue === 'light' ? 'light' : 'dark');
            }
            if (changes.bookmarks) {
                setAppState(prev => prev ? { ...prev, bookmarks: changes.bookmarks.newValue || [] } : null);
            }
            if (changes.folders) {
                setAppState(prev => prev ? { ...prev, folders: changes.folders.newValue || [] } : null);
            }
            if (changes.chats) {
                setAppState(prev => prev ? { ...prev, chats: changes.chats.newValue || [] } : null);
            }
        });
        return cleanup;
    }, []);

    const handleThemeToggle = () => {
        const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        saveTheme(next);
    };

    const handleCreateFolder = async () => {
        if (!appState) return;
        const res = await folderUseCase.createFolder(appState);
        setAppState({ ...appState, folders: res.folders });
        setEditingFolderId(res.newFolderId);
        setEditingName('New Folder');
    };

    const handleRenameFolder = async (folderId: string) => {
        if (!appState || !editingName.trim()) return;
        const updated = await folderUseCase.renameFolder(appState, folderId, editingName.trim());
        setAppState({ ...appState, folders: updated });
        setEditingFolderId(null);
        setEditingName('');
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!appState) return;
        const res = await folderUseCase.deleteFolder(appState, folderId);
        setAppState({ ...appState, folders: res.folders, chats: res.chats });
        setFolderMenuId(null);
    };

    const handleDeleteBookmark = async (bookmarkId: string) => {
        if (!appState) return;
        const updated = await chatUseCase.deleteBookmark(appState, bookmarkId);
        setAppState({ ...appState, bookmarks: updated });
    };

    const handleExportFolder = (folderId: string, format: 'json' | 'md', allChats: ChatNode[]) => {
        if (!appState) return;
        const folder = appState.folders.find(f => f.id === folderId);
        if (!folder) return;
        ExportUseCase.exportFolder(folder, allChats, format);
        setFolderMenuId(null);
    };

    const toggleFolderExpand = (folderId: string) => {
        setExpandedFolders(prev => { const n = new Set(prev); n.has(folderId) ? n.delete(folderId) : n.add(folderId); return n; });
    };

    const handleAssignToFolder = async (chatId: string, folderId: string | undefined, allChats: ChatNode[]) => {
        if (!appState) return;
        const updated = await chatUseCase.assignToFolder(appState, allChats, chatId, folderId);
        setAppState({ ...appState, chats: updated });
        setAssigningChatId(null);
        if (folderId) setExpandedFolders(prev => new Set([...prev, folderId]));
    };

    const handleAssignFolderToFolder = async (sourceFolderId: string, targetFolderId: string | undefined) => {
        if (!appState) return;
        const updated = await folderUseCase.assignFolderToFolder(appState, sourceFolderId, targetFolderId);
        setAppState({ ...appState, folders: updated });
        if (targetFolderId) setExpandedFolders(prev => new Set([...prev, targetFolderId]));
    };

    const handleTogglePin = async (chatId: string, allChats: ChatNode[]) => {
        if (!appState) return;
        const updated = await chatUseCase.togglePin(appState, allChats, chatId);
        setAppState({ ...appState, chats: updated });
    };

    const sortChats = (chats: ChatNode[]) => {
        return [...chats].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };

    const platform = useMemo(() => {
        const h = window.location.hostname;
        if (h.includes('chatgpt.com')) return 'chatgpt' as const;
        if (h.includes('claude.ai')) return 'claude' as const;
        if (h.includes('gemini.google.com')) return 'gemini' as const;
        return 'chatgpt' as const;
    }, []);

    const allChats: ChatNode[] = useMemo(() => {
        if (!appState) return [];
        return nativeChats
            .filter(c => { const x = c.title.toLowerCase().trim(); return x.length > 2 && x !== 'new chat' && x !== 'untitled' && x !== 'untitled chat'; })
            .map(c => {
                const s = appState.chats.find(sc => sc.id === c.id);
                return { id: c.id, title: c.title, url: c.href, platform, folderId: s?.folderId, isPinned: s?.isPinned || false, createdAt: s?.createdAt || Date.now() };
            });
    }, [nativeChats, appState?.chats, platform]);

    return {
        appState,
        searchResults, setSearchResults,
        editingFolderId, setEditingFolderId,
        editingName, setEditingName,
        expandedFolders, setExpandedFolders,
        assigningChatId, setAssigningChatId,
        folderMenuId, setFolderMenuId,
        themeMode,
        dragOverFolderId, setDragOverFolderId,
        t,
        allChats,
        handleThemeToggle,
        handleCreateFolder,
        handleRenameFolder,
        handleDeleteFolder,
        handleDeleteBookmark,
        handleExportFolder,
        toggleFolderExpand,
        handleAssignToFolder,
        handleAssignFolderToFolder,
        handleTogglePin,
        sortChats,
        formatDate
    };
}
