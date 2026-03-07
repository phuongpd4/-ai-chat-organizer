import { useEffect, useState, useRef, useMemo } from 'react';
import { AppStorage, getStorageData, saveFolders, saveChats, Folder, ChatNode } from '@extension/shared/lib/storage';
import { useDOMObserver } from '@extension/shared/hooks/useDOMObserver';
import { getTheme, getSavedTheme, saveTheme, ThemeMode, ThemeColors } from '@extension/shared/lib/theme';
import { FolderIcon, Plus, MoreVertical, MessageSquare, Pencil, Trash2, ChevronDown, ChevronRight, FolderInput, X, Sun, Moon, Pin, Bookmark, Download } from 'lucide-react';
import SearchBar from './SearchBar';

export default function SidebarContainer() {
    const [appState, setAppState] = useState<AppStorage | null>(null);
    const [searchResults, setSearchResults] = useState<ChatNode[] | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['system_bookmarks'])); // Mặc định mở Bookmarks
    const [assigningChatId, setAssigningChatId] = useState<string | null>(null);
    const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const nativeChats = useDOMObserver();
    const t: ThemeColors = getTheme(themeMode);

    useEffect(() => {
        getStorageData().then(setAppState);
        getSavedTheme().then(setThemeMode);

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'sync') {
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
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    useEffect(() => {
        if (editingFolderId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingFolderId]);

    const handleThemeToggle = () => {
        const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        saveTheme(next);
    };

    const handleCreateFolder = () => {
        if (!appState) return;
        const newFolder: Folder = { id: `folder_${Date.now()}`, name: 'New Folder', color: '#3b82f6', createdAt: Date.now() };
        const newFolders = [...appState.folders, newFolder];
        setAppState({ ...appState, folders: newFolders });
        saveFolders(newFolders);
        setEditingFolderId(newFolder.id);
        setEditingName(newFolder.name);
    };

    const handleRenameFolder = (folderId: string) => {
        if (!appState || !editingName.trim()) return;
        const updated = appState.folders.map(f => f.id === folderId ? { ...f, name: editingName.trim() } : f);
        setAppState({ ...appState, folders: updated });
        saveFolders(updated);
        setEditingFolderId(null);
        setEditingName('');
    };

    const handleDeleteFolder = (folderId: string) => {
        if (!appState) return;
        // Lấy tất cả thư mục con (recursive delete optional, here we just delete current and unassign child chats)
        // Để đơn giản (MVP), ta xoá thư mục đó, các sub-folder sẽ bị mồ côi (trở thành list ngoài cùng), các đoạn chat bên trong thư mục bị gỡ khỏi thư mục.
        const updatedFolders = appState.folders.filter(f => f.id !== folderId).map(f => f.parentId === folderId ? { ...f, parentId: undefined } : f);
        const updatedChats = appState.chats.map(c => c.folderId === folderId ? { ...c, folderId: undefined } : c);

        setAppState({ ...appState, folders: updatedFolders, chats: updatedChats });
        saveFolders(updatedFolders);
        saveChats(updatedChats);
        setFolderMenuId(null);
    };

    const handleDeleteBookmark = (bookmarkId: string) => {
        if (!appState) return;
        const updatedBookmarks = appState.bookmarks.filter(b => b.id !== bookmarkId);
        setAppState({ ...appState, bookmarks: updatedBookmarks });
        chrome.storage.sync.set({ bookmarks: updatedBookmarks });
    };

    const handleExportFolder = (folderId: string, format: 'json' | 'md') => {
        if (!appState) return;
        const folder = appState.folders.find(f => f.id === folderId);
        if (!folder) return;

        // Lấy tất cả các đoạn chat nằm trong folder này (chỉ level 1 trong MVP)
        const chatsToExport = allChats.filter(c => c.folderId === folderId);

        let content = '';
        let filename = `${folder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export`;
        let mimeType = 'text/plain';

        if (format === 'json') {
            const exportData = {
                folder: folder.name,
                exportedAt: new Date().toISOString(),
                chats: chatsToExport.map(c => ({
                    title: c.title,
                    url: c.url,
                    platform: c.platform,
                    createdAt: new Date(c.createdAt).toISOString()
                }))
            };
            content = JSON.stringify(exportData, null, 2);
            filename += '.json';
            mimeType = 'application/json';
        } else if (format === 'md') {
            content += `# Folder: ${folder.name}\n\n`;
            content += `*Exported at: ${new Date().toLocaleString('en-GB')}*\n\n`;
            content += `## Chats (${chatsToExport.length})\n\n`;
            chatsToExport.forEach(c => {
                content += `- **[${c.platform}]** [${c.title}](${c.url}) - *Created: ${new Date(c.createdAt).toLocaleString('en-GB')}*\n`;
            });
            filename += '.md';
            mimeType = 'text/markdown';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFolderMenuId(null);
    };

    const toggleFolderExpand = (folderId: string) => {
        setExpandedFolders(prev => { const n = new Set(prev); n.has(folderId) ? n.delete(folderId) : n.add(folderId); return n; });
    };

    const handleAssignToFolder = (chatId: string, folderId: string | undefined) => {
        if (!appState) return;
        let updatedChats = [...appState.chats];
        const idx = updatedChats.findIndex(c => c.id === chatId);
        if (idx >= 0) {
            updatedChats[idx] = { ...updatedChats[idx], folderId };
        } else {
            const native = allChats.find(c => c.id === chatId);
            if (native) updatedChats.push({ ...native, folderId });
        }
        setAppState({ ...appState, chats: updatedChats });
        saveChats(updatedChats);
        setAssigningChatId(null);
        if (folderId) setExpandedFolders(prev => new Set([...prev, folderId]));
    };

    const handleAssignFolderToFolder = (sourceFolderId: string, targetFolderId: string | undefined) => {
        if (!appState) return;
        if (sourceFolderId === targetFolderId) return;

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

        if (isCircular) return; // Prevent infinite loop

        const updated = appState.folders.map(f => f.id === sourceFolderId ? { ...f, parentId: targetFolderId } : f);
        setAppState({ ...appState, folders: updated });
        saveFolders(updated);
        if (targetFolderId) setExpandedFolders(prev => new Set([...prev, targetFolderId]));
    };

    const handleTogglePin = (chatId: string) => {
        if (!appState) return;
        let updatedChats = [...appState.chats];
        const idx = updatedChats.findIndex(c => c.id === chatId);
        if (idx >= 0) {
            updatedChats[idx] = { ...updatedChats[idx], isPinned: !updatedChats[idx].isPinned };
        } else {
            const native = allChats.find(c => c.id === chatId);
            if (native) updatedChats.push({ ...native, isPinned: true });
        }
        setAppState({ ...appState, chats: updatedChats });
        saveChats(updatedChats);
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

    if (!appState) return null;

    const chatsInFolders = new Map<string, ChatNode[]>();
    const unassignedChats: ChatNode[] = [];
    for (const ch of allChats) {
        if (ch.folderId) { const a = chatsInFolders.get(ch.folderId) || []; a.push(ch); chatsInFolders.set(ch.folderId, a); }
        else unassignedChats.push(ch);
    }

    const displayChats = sortChats(searchResults || unassignedChats);

    // Xây dựng cây folder
    const renderFolderNode = (folder: Folder, depth: number = 0) => {
        const exp = expandedFolders.has(folder.id);
        const fChats = sortChats(chatsInFolders.get(folder.id) || []);
        const childFolders = appState.folders.filter(f => f.parentId === folder.id);

        const editing = editingFolderId === folder.id;
        const menu = folderMenuId === folder.id;
        const isDragOver = dragOverFolderId === folder.id;

        return (
            <div key={folder.id} style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
                <div
                    draggable={!editing}
                    onDragStart={(e) => {
                        if (!editing) {
                            e.dataTransfer.setData('application/folder-id', folder.id);
                        }
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolderId(null); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderId(null);

                        // Thả Chat
                        const chatId = e.dataTransfer.getData('application/chat-id');
                        if (chatId) {
                            handleAssignToFolder(chatId, folder.id);
                            return;
                        }

                        // Thả Folder khác vào Folder này
                        const sourceFolderId = e.dataTransfer.getData('application/folder-id');
                        if (sourceFolderId && sourceFolderId !== folder.id) {
                            handleAssignFolderToFolder(sourceFolderId, folder.id);
                        }
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', cursor: editing ? 'text' : 'grab', position: 'relative', transition: 'all 0.15s',
                        background: isDragOver ? 'rgba(34, 197, 94, 0.15)' : 'transparent', // Light green tint
                        border: isDragOver ? `1px dashed #22c55e` : '1px solid transparent', // Green dashboard
                    }}
                    onMouseEnter={e => { if (!isDragOver) e.currentTarget.style.background = t.bgHover; }}
                    onMouseLeave={e => { if (!isDragOver) e.currentTarget.style.background = 'transparent'; }}
                >
                    <span onClick={() => toggleFolderExpand(folder.id)} style={{ display: 'flex', color: t.textMuted, cursor: 'pointer', width: 14, justifyContent: 'center' }}>
                        {(exp || childFolders.length > 0 || fChats.length > 0) ? (exp ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
                    </span>
                    <FolderIcon size={14} style={{ color: folder.color || '#60a5fa', flexShrink: 0 }} />

                    {editing ? (
                        <input ref={editInputRef} value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(folder.id); if (e.key === 'Escape') { setEditingFolderId(null); setEditingName(''); } }}
                            onBlur={() => handleRenameFolder(folder.id)}
                            style={{ flex: 1, fontSize: '13px', background: t.bgInput, border: `1px solid ${t.borderFocus}`, borderRadius: '4px', padding: '2px 6px', color: t.textHeading, outline: 'none', minWidth: 0 }}
                        />
                    ) : (
                        <div onClick={() => toggleFolderExpand(folder.id)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, cursor: 'pointer' }}>
                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{folder.name}</span>
                            <span style={{ fontSize: '9px', color: t.textMuted, marginTop: '1px' }}>Created {formatDate(folder.createdAt)}</span>
                        </div>
                    )}

                    {fChats.length > 0 && !editing && (<span style={{ fontSize: '10px', color: t.textMuted, background: t.badge, borderRadius: '8px', padding: '0 5px' }}>{fChats.length}</span>)}
                    {!editing && (
                        <button onClick={e => { e.stopPropagation(); setFolderMenuId(menu ? null : folder.id); }}
                            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                        ><MoreVertical size={13} /></button>
                    )}

                    {menu && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: t.dropdown, border: `1px solid ${t.dropdownBorder}`, borderRadius: '6px', padding: '4px', minWidth: '120px', boxShadow: `0 4px 12px ${t.shadow}` }}>
                            <button onClick={() => { setEditingFolderId(folder.id); setEditingName(folder.name); setFolderMenuId(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Pencil size={12} /> Rename</button>
                            <button onClick={() => handleExportFolder(folder.id, 'md')}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Download size={12} /> Export MD</button>
                            <button onClick={() => handleExportFolder(folder.id, 'json')}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Download size={12} /> Export JSON</button>
                            <button onClick={() => handleDeleteFolder(folder.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.danger, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Trash2 size={12} /> Delete</button>
                        </div>
                    )}
                </div>

                {exp && (
                    <div style={{ marginLeft: '12px', borderLeft: `1px solid ${t.border}`, paddingLeft: '8px' }}>
                        {/* Recursive Render Children Folders */}
                        {childFolders.map(cf => renderFolderNode(cf, depth + 1))}

                        {/* File Chats */}
                        {fChats.length === 0 && childFolders.length === 0 ? (
                            <div
                                style={{ fontSize: '11px', color: t.textMuted, padding: '12px 8px', textAlign: 'center', border: `1px dashed ${t.border}`, margin: '4px 0', borderRadius: '4px' }}
                            >
                                Drop chats or folders here
                            </div>
                        ) : fChats.map(chat => (
                            <div key={chat.id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData('application/chat-id', chat.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', padding: '2px 4px', transition: 'background 0.15s', cursor: 'grab' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <a href={chat.url} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textDecoration: 'none', color: t.text, overflow: 'hidden', padding: '4px 2px' }}>
                                    <MessageSquare size={11} style={{ color: t.textMuted, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                </a>
                                {/* Pin Button */}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleTogglePin(chat.id); }} title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                                    style={{ background: 'none', border: 'none', color: chat.isPinned ? t.accent : t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: chat.isPinned ? 1 : 0.3 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = chat.isPinned ? '1' : '0.3')}
                                ><Pin size={11} fill={chat.isPinned ? t.accent : 'none'} /></button>

                                {/* Remove from Folder Button */}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleAssignToFolder(chat.id, undefined); }} title="Remove from folder"
                                    style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.3 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                                ><X size={11} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '288px', background: t.bg, color: t.text, borderRight: `1px solid ${t.border}`, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${t.border}` }}>
                <h1 style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em', color: t.textHeading, margin: 0 }}>AI Chat Org</h1>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleThemeToggle}
                        title={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: '5px', padding: '4px 6px', cursor: 'pointer', color: t.textSecondary, display: 'flex', alignItems: 'center' }}
                    >
                        {themeMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>
                <SearchBar chats={allChats} onSearchResults={setSearchResults} theme={t} />
                <button onClick={handleCreateFolder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: t.accent, padding: '0 8px', color: '#fff', border: 'none', cursor: 'pointer' }} title="New Folder">
                    <Plus size={16} />
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {/* Folders List */}
                {!searchResults && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted }}>
                            Folders ({appState.folders.length})
                        </div>
                        {appState.folders.length === 0 ? (
                            <div style={{ fontSize: '12px', color: t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '6px' }}>Click + to create folder</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {/* System Folder: Bookmarks */}
                                <div key="system_bookmarks">
                                    <div
                                        onClick={() => toggleFolderExpand('system_bookmarks')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ display: 'flex', color: t.textMuted, width: 14, justifyContent: 'center' }}>
                                            {(expandedFolders.has('system_bookmarks') || (appState.bookmarks?.length > 0)) ? (expandedFolders.has('system_bookmarks') ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
                                        </span>
                                        <Bookmark size={14} style={{ color: '#10b981', flexShrink: 0 }} />

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text, fontWeight: 500 }}>Saved Bookmarks</span>
                                        </div>

                                        {appState.bookmarks?.length > 0 && (<span style={{ fontSize: '10px', color: t.textMuted, background: t.badge, borderRadius: '8px', padding: '0 5px' }}>{appState.bookmarks.length}</span>)}
                                    </div>

                                    {expandedFolders.has('system_bookmarks') && (
                                        <div style={{ marginLeft: '12px', borderLeft: `1px solid ${t.border}`, paddingLeft: '8px' }}>
                                            {(!appState.bookmarks || appState.bookmarks.length === 0) ? (
                                                <div style={{ fontSize: '11px', color: t.textMuted, padding: '12px 8px', textAlign: 'center', border: `1px dashed ${t.border}`, margin: '4px 0', borderRadius: '4px' }}>
                                                    Click 'Save' on any AI message
                                                </div>
                                            ) : appState.bookmarks.map(bm => (
                                                <div key={bm.id}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', padding: '4px 6px', transition: 'background 0.15s', position: 'relative' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = t.bgHover; (e.currentTarget.lastChild as HTMLElement).style.opacity = '1'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget.lastChild as HTMLElement).style.opacity = '0'; }}
                                                >
                                                    <a href={bm.url} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: t.text, overflow: 'hidden' }}>
                                                        <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontStyle: 'italic', color: t.textSecondary, lineHeight: '1.4' }}>"{bm.textExcerpt}"</span>
                                                        <span style={{ fontSize: '9px', color: t.textMuted, marginTop: '2px' }}>{formatDate(bm.createdAt)}</span>
                                                    </a>
                                                    {/* Delete Bookmark Button */}
                                                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteBookmark(bm.id); }} title="Delete bookmark"
                                                        style={{ background: 'none', border: 'none', color: t.danger, cursor: 'pointer', padding: '4px', display: 'flex', opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
                                                    ><Trash2 size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Only render top-level folders */}
                                {appState.folders.filter(f => !f.parentId).map(folder => renderFolderNode(folder, 0))}
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Chats / Search Results */}
                <div
                    // Area to drop files/folders back to ROOT level
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Drop chat -> remove from folder
                        const chatId = e.dataTransfer.getData('application/chat-id');
                        if (chatId) handleAssignToFolder(chatId, undefined);

                        // Drop folder -> pull out to root level
                        const folderId = e.dataTransfer.getData('application/folder-id');
                        if (folderId) handleAssignFolderToFolder(folderId, undefined);
                    }}
                    style={{ minHeight: '100px', paddingBottom: '20px' }}
                >
                    <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted }}>
                        {searchResults ? 'Search Results' : `Recent Chats (${displayChats.length})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {displayChats.length === 0 ? (
                            <div style={{ fontSize: '12px', color: t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '6px' }}>No chats found</div>
                        ) : displayChats.map(chat => (
                            <div key={chat.id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData('application/chat-id', chat.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '4px 6px', position: 'relative', transition: 'background 0.15s', cursor: 'grab' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <a href={chat.url} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textDecoration: 'none', color: t.text, overflow: 'hidden', padding: '4px 2px' }}>
                                    <MessageSquare size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                </a>

                                {/* Pin Button */}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleTogglePin(chat.id); }} title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                                    style={{ background: 'none', border: 'none', color: chat.isPinned ? t.accent : t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: chat.isPinned ? 1 : 0.3, flexShrink: 0 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = chat.isPinned ? '1' : '0.3')}
                                ><Pin size={13} fill={chat.isPinned ? t.accent : 'none'} /></button>

                                {/* Move to Folder button */}
                                {appState.folders.length > 0 && (
                                    <button onClick={e => { e.stopPropagation(); setAssigningChatId(assigningChatId === chat.id ? null : chat.id); }} title="Move to folder"
                                        style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.3, flexShrink: 0 }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                                    ><FolderInput size={13} /></button>
                                )}

                                {assigningChatId === chat.id && (
                                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: t.dropdown, border: `1px solid ${t.dropdownBorder}`, borderRadius: '6px', padding: '4px', minWidth: '140px', boxShadow: `0 4px 12px ${t.shadow}` }}>
                                        <div style={{ padding: '4px 8px', fontSize: '10px', color: t.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Move to...</div>
                                        {/* Only show top-level folders for manual drop to not clutter. Or keep simple mapping, we just map all folders with indentation or parent name. Let's map all folders for now to avoid breaking existing feature. */}
                                        {appState.folders.map(folder => (
                                            <button key={folder.id} onClick={() => handleAssignToFolder(chat.id, folder.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            ><FolderIcon size={12} style={{ color: folder.color || '#60a5fa' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span></button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {(folderMenuId || assigningChatId) && (
                <div onClick={() => { setFolderMenuId(null); setAssigningChatId(null); }} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            )}
        </div>
    );
}
