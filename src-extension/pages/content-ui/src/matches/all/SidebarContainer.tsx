import { useEffect, useState, useRef } from 'react';
import { AppStorage, getStorageData, saveFolders, saveChats, Folder, ChatNode } from '@extension/shared/lib/storage';
import { useDOMObserver } from '@extension/shared/hooks/useDOMObserver';
import { getTheme, getSavedTheme, saveTheme, ThemeMode, ThemeColors } from '@extension/shared/lib/theme';
import { FolderIcon, Plus, MoreVertical, MessageSquare, Pencil, Trash2, ChevronDown, ChevronRight, FolderInput, X, Sun, Moon } from 'lucide-react';
import SearchBar from './SearchBar';

export default function SidebarContainer() {
    const [appState, setAppState] = useState<AppStorage | null>(null);
    const [searchResults, setSearchResults] = useState<ChatNode[] | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [assigningChatId, setAssigningChatId] = useState<string | null>(null);
    const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const editInputRef = useRef<HTMLInputElement>(null);

    const nativeChats = useDOMObserver();
    const t: ThemeColors = getTheme(themeMode);

    useEffect(() => {
        getStorageData().then(setAppState);
        getSavedTheme().then(setThemeMode);

        // Lắng nghe thay đổi theme từ popup
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'sync' && changes.themeMode) {
                setThemeMode(changes.themeMode.newValue === 'light' ? 'light' : 'dark');
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

    // ── Theme Toggle ────────────────────────────────
    const handleThemeToggle = () => {
        const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(next);
        saveTheme(next);
    };

    // ── Folder Actions ──────────────────────────────
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
        const updated = appState.folders.filter(f => f.id !== folderId);
        const updatedChats = appState.chats.map(c => c.folderId === folderId ? { ...c, folderId: undefined } : c);
        setAppState({ ...appState, folders: updated, chats: updatedChats });
        saveFolders(updated);
        saveChats(updatedChats);
        setFolderMenuId(null);
    };

    const toggleFolderExpand = (folderId: string) => {
        setExpandedFolders(prev => { const n = new Set(prev); n.has(folderId) ? n.delete(folderId) : n.add(folderId); return n; });
    };

    // ── Chat → Folder Assignment ────────────────────
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

    if (!appState) return null;

    // ── Data ────────────────────────────────────────
    const platform = (() => {
        const h = window.location.hostname;
        if (h.includes('chatgpt.com')) return 'chatgpt' as const;
        if (h.includes('claude.ai')) return 'claude' as const;
        if (h.includes('gemini.google.com')) return 'gemini' as const;
        return 'chatgpt' as const;
    })();

    const allChats: ChatNode[] = nativeChats
        .filter(c => { const x = c.title.toLowerCase().trim(); return x.length > 2 && x !== 'new chat' && x !== 'untitled' && x !== 'untitled chat'; })
        .map(c => {
            const s = appState.chats.find(sc => sc.id === c.id);
            return { id: c.id, title: c.title, url: c.href, platform, folderId: s?.folderId, isPinned: s?.isPinned || false, createdAt: s?.createdAt || Date.now() };
        });

    const chatsInFolders = new Map<string, ChatNode[]>();
    const unassignedChats: ChatNode[] = [];
    for (const ch of allChats) {
        if (ch.folderId) { const a = chatsInFolders.get(ch.folderId) || []; a.push(ch); chatsInFolders.set(ch.folderId, a); }
        else unassignedChats.push(ch);
    }
    const displayChats = searchResults || unassignedChats;

    // ── Render ───────────────────────────────────────
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
                {/* Folders */}
                {!searchResults && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted }}>
                            Folders ({appState.folders.length})
                        </div>
                        {appState.folders.length === 0 ? (
                            <div style={{ fontSize: '12px', color: t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '6px' }}>Click + to create folder</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {appState.folders.map(folder => {
                                    const exp = expandedFolders.has(folder.id);
                                    const fChats = chatsInFolders.get(folder.id) || [];
                                    const editing = editingFolderId === folder.id;
                                    const menu = folderMenuId === folder.id;

                                    return (
                                        <div key={folder.id}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = t.bgHover)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span onClick={() => toggleFolderExpand(folder.id)} style={{ display: 'flex', color: t.textMuted }}>
                                                    {exp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                                                    <span onClick={() => toggleFolderExpand(folder.id)} style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: t.text }}>{folder.name}</span>
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
                                                        <button onClick={() => handleDeleteFolder(folder.id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: t.danger, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                        ><Trash2 size={12} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>

                                            {exp && (
                                                <div style={{ marginLeft: '24px', borderLeft: `1px solid ${t.border}`, paddingLeft: '8px' }}>
                                                    {fChats.length === 0 ? (
                                                        <div style={{ fontSize: '11px', color: t.textMuted, padding: '6px 0' }}>Empty — drag chats here</div>
                                                    ) : fChats.map(chat => (
                                                        <a key={chat.id} href={chat.url}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '4px', padding: '4px 6px', textDecoration: 'none', color: t.text, fontSize: '12px', transition: 'background 0.15s' }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                        >
                                                            <MessageSquare size={11} style={{ color: t.textMuted, flexShrink: 0 }} />
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleAssignToFolder(chat.id, undefined); }} title="Remove"
                                                                style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.5 }}
                                                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                                                            ><X size={11} /></button>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Chats / Search Results */}
                <div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted }}>
                        {searchResults ? 'Search Results' : `Recent Chats (${displayChats.length})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {displayChats.length === 0 ? (
                            <div style={{ fontSize: '12px', color: t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '6px' }}>No chats found</div>
                        ) : displayChats.map(chat => (
                            <div key={chat.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', position: 'relative', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <a href={chat.url} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textDecoration: 'none', color: t.text, overflow: 'hidden' }}>
                                    <MessageSquare size={13} style={{ color: t.textMuted, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                </a>
                                {appState.folders.length > 0 && (
                                    <button onClick={e => { e.stopPropagation(); setAssigningChatId(assigningChatId === chat.id ? null : chat.id); }} title="Move to folder"
                                        style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.5, flexShrink: 0 }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                                    ><FolderInput size={13} /></button>
                                )}
                                {assigningChatId === chat.id && (
                                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: t.dropdown, border: `1px solid ${t.dropdownBorder}`, borderRadius: '6px', padding: '4px', minWidth: '140px', boxShadow: `0 4px 12px ${t.shadow}` }}>
                                        <div style={{ padding: '4px 8px', fontSize: '10px', color: t.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Move to...</div>
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
