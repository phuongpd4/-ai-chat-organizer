import { useEffect, useRef } from 'react';
import { FolderIcon, Plus, MoreVertical, MessageSquare, Pencil, Trash2, ChevronDown, ChevronRight, FolderInput, X, Sun, Moon, Pin, Bookmark, Download } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAppViewModel } from '@extension/shared/hooks/useAppViewModel';
import { Folder } from '@extension/shared/core/types';

export default function SidebarContainer() {
    const vm = useAppViewModel();
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (vm.editingFolderId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [vm.editingFolderId]);

    if (!vm.appState) return null;

    const chatsInFolders = new Map<string, typeof vm.allChats>();
    const unassignedChats: typeof vm.allChats = [];
    for (const ch of vm.allChats) {
        if (ch.folderId) { const a = chatsInFolders.get(ch.folderId) || []; a.push(ch); chatsInFolders.set(ch.folderId, a); }
        else unassignedChats.push(ch);
    }

    const displayChats = vm.sortChats(vm.searchResults || unassignedChats);

    // Xây dựng cây folder
    const renderFolderNode = (folder: Folder, depth: number = 0) => {
        const exp = vm.expandedFolders.has(folder.id);
        const fChats = vm.sortChats(chatsInFolders.get(folder.id) || []);
        const childFolders = vm.appState!.folders.filter(f => f.parentId === folder.id);

        const editing = vm.editingFolderId === folder.id;
        const menu = vm.folderMenuId === folder.id;
        const isDragOver = vm.dragOverFolderId === folder.id;

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
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); vm.setDragOverFolderId(folder.id); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); vm.setDragOverFolderId(null); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        vm.setDragOverFolderId(null);

                        // Thả Chat
                        const chatId = e.dataTransfer.getData('application/chat-id');
                        if (chatId) {
                            vm.handleAssignToFolder(chatId, folder.id, vm.allChats);
                            return;
                        }

                        // Thả Folder khác vào Folder này
                        const sourceFolderId = e.dataTransfer.getData('application/folder-id');
                        if (sourceFolderId && sourceFolderId !== folder.id) {
                            vm.handleAssignFolderToFolder(sourceFolderId, folder.id);
                        }
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', cursor: editing ? 'text' : 'grab', position: 'relative', transition: 'all 0.15s',
                        background: isDragOver ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                        border: isDragOver ? `1px dashed #22c55e` : '1px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isDragOver) e.currentTarget.style.background = vm.t.bgHover; }}
                    onMouseLeave={e => { if (!isDragOver) e.currentTarget.style.background = 'transparent'; }}
                >
                    <span onClick={() => vm.toggleFolderExpand(folder.id)} style={{ display: 'flex', color: vm.t.textMuted, cursor: 'pointer', width: 14, justifyContent: 'center' }}>
                        {(exp || childFolders.length > 0 || fChats.length > 0) ? (exp ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
                    </span>
                    <FolderIcon size={14} style={{ color: folder.color || '#60a5fa', flexShrink: 0 }} />

                    {editing ? (
                        <input ref={editInputRef} value={vm.editingName}
                            onChange={e => vm.setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') vm.handleRenameFolder(folder.id); if (e.key === 'Escape') { vm.setEditingFolderId(null); vm.setEditingName(''); } }}
                            onBlur={() => vm.handleRenameFolder(folder.id)}
                            style={{ flex: 1, fontSize: '13px', background: vm.t.bgInput, border: `1px solid ${vm.t.borderFocus}`, borderRadius: '4px', padding: '2px 6px', color: vm.t.textHeading, outline: 'none', minWidth: 0 }}
                        />
                    ) : (
                        <div onClick={() => vm.toggleFolderExpand(folder.id)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, cursor: 'pointer' }}>
                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: vm.t.text }}>{folder.name}</span>
                            <span style={{ fontSize: '9px', color: vm.t.textMuted, marginTop: '1px' }}>Created {vm.formatDate(folder.createdAt)}</span>
                        </div>
                    )}

                    {fChats.length > 0 && !editing && (<span style={{ fontSize: '10px', color: vm.t.textMuted, background: vm.t.badge, borderRadius: '8px', padding: '0 5px' }}>{fChats.length}</span>)}
                    {!editing && (
                        <button onClick={e => { e.stopPropagation(); vm.setFolderMenuId(menu ? null : folder.id); }}
                            style={{ background: 'none', border: 'none', color: vm.t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                        ><MoreVertical size={13} /></button>
                    )}

                    {menu && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: vm.t.dropdown, border: `1px solid ${vm.t.dropdownBorder}`, borderRadius: '6px', padding: '4px', minWidth: '120px', boxShadow: `0 4px 12px ${vm.t.shadow}` }}>
                            <button onClick={() => { vm.setEditingFolderId(folder.id); vm.setEditingName(folder.name); vm.setFolderMenuId(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: vm.t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Pencil size={12} /> Rename</button>
                            <button onClick={() => vm.handleExportFolder(folder.id, 'md', vm.allChats)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: vm.t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Download size={12} /> Export MD</button>
                            <button onClick={() => vm.handleExportFolder(folder.id, 'json', vm.allChats)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: vm.t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Download size={12} /> Export JSON</button>
                            <button onClick={() => vm.handleDeleteFolder(folder.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: vm.t.danger, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            ><Trash2 size={12} /> Delete</button>
                        </div>
                    )}
                </div>

                {exp && (
                    <div style={{ marginLeft: '12px', borderLeft: `1px solid ${vm.t.border}`, paddingLeft: '8px' }}>
                        {childFolders.map(cf => renderFolderNode(cf, depth + 1))}

                        {fChats.length === 0 && childFolders.length === 0 ? (
                            <div style={{ fontSize: '11px', color: vm.t.textMuted, padding: '12px 8px', textAlign: 'center', border: `1px dashed ${vm.t.border}`, margin: '4px 0', borderRadius: '4px' }}>
                                Drop chats or folders here
                            </div>
                        ) : fChats.map(chat => (
                            <div key={chat.id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData('application/chat-id', chat.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', padding: '2px 4px', transition: 'background 0.15s', cursor: 'grab' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <a href={chat.url} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textDecoration: 'none', color: vm.t.text, overflow: 'hidden', padding: '4px 2px' }}>
                                    <MessageSquare size={11} style={{ color: vm.t.textMuted, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                </a>
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); vm.handleTogglePin(chat.id, vm.allChats); }} title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                                    style={{ background: 'none', border: 'none', color: chat.isPinned ? vm.t.accent : vm.t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: chat.isPinned ? 1 : 0.3 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = chat.isPinned ? '1' : '0.3')}
                                ><Pin size={11} fill={chat.isPinned ? vm.t.accent : 'none'} /></button>

                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); vm.handleAssignToFolder(chat.id, undefined, vm.allChats); }} title="Remove from folder"
                                    style={{ background: 'none', border: 'none', color: vm.t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.3 }}
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '288px', background: vm.t.bg, color: vm.t.text, borderRight: `1px solid ${vm.t.border}`, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${vm.t.border}` }}>
                <h1 style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.05em', color: vm.t.textHeading, margin: 0 }}>AI Chat Org</h1>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={vm.handleThemeToggle}
                        title={vm.themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        style={{ background: 'none', border: `1px solid ${vm.t.border}`, borderRadius: '5px', padding: '4px 6px', cursor: 'pointer', color: vm.t.textSecondary, display: 'flex', alignItems: 'center' }}
                    >
                        {vm.themeMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderBottom: `1px solid ${vm.t.border}` }}>
                <SearchBar chats={vm.allChats} onSearchResults={vm.setSearchResults} theme={vm.t} />
                <button onClick={vm.handleCreateFolder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: vm.t.accent, padding: '0 8px', color: '#fff', border: 'none', cursor: 'pointer' }} title="New Folder">
                    <Plus size={16} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {!vm.searchResults && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: vm.t.textMuted }}>
                            Folders ({vm.appState.folders.length})
                        </div>
                        {vm.appState.folders.length === 0 ? (
                            <div style={{ fontSize: '12px', color: vm.t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${vm.t.border}`, borderRadius: '6px' }}>Click + to create folder</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div key="system_bookmarks">
                                    <div
                                        onClick={() => vm.toggleFolderExpand('system_bookmarks')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = vm.t.bgHover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ display: 'flex', color: vm.t.textMuted, width: 14, justifyContent: 'center' }}>
                                            {(vm.expandedFolders.has('system_bookmarks') || (vm.appState.bookmarks?.length > 0)) ? (vm.expandedFolders.has('system_bookmarks') ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
                                        </span>
                                        <Bookmark size={14} style={{ color: '#10b981', flexShrink: 0 }} />

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: vm.t.text, fontWeight: 500 }}>Saved Bookmarks</span>
                                        </div>

                                        {vm.appState.bookmarks?.length > 0 && (<span style={{ fontSize: '10px', color: vm.t.textMuted, background: vm.t.badge, borderRadius: '8px', padding: '0 5px' }}>{vm.appState.bookmarks.length}</span>)}
                                    </div>

                                    {vm.expandedFolders.has('system_bookmarks') && (
                                        <div style={{ marginLeft: '12px', borderLeft: `1px solid ${vm.t.border}`, paddingLeft: '8px' }}>
                                            {(!vm.appState.bookmarks || vm.appState.bookmarks.length === 0) ? (
                                                <div style={{ fontSize: '11px', color: vm.t.textMuted, padding: '12px 8px', textAlign: 'center', border: `1px dashed ${vm.t.border}`, margin: '4px 0', borderRadius: '4px' }}>
                                                    Click 'Save' on any AI message
                                                </div>
                                            ) : vm.appState.bookmarks.map(bm => (
                                                <div key={bm.id}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', padding: '4px 6px', transition: 'background 0.15s', position: 'relative' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = vm.t.bgHover; (e.currentTarget.lastChild as HTMLElement).style.opacity = '1'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget.lastChild as HTMLElement).style.opacity = '0'; }}
                                                >
                                                    <a href={bm.url} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: vm.t.text, overflow: 'hidden' }}>
                                                        <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontStyle: 'italic', color: vm.t.textSecondary, lineHeight: '1.4' }}>"{bm.textExcerpt}"</span>
                                                        <span style={{ fontSize: '9px', color: vm.t.textMuted, marginTop: '2px' }}>{vm.formatDate(bm.createdAt)}</span>
                                                    </a>
                                                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); vm.handleDeleteBookmark(bm.id); }} title="Delete bookmark"
                                                        style={{ background: 'none', border: 'none', color: vm.t.danger, cursor: 'pointer', padding: '4px', display: 'flex', opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
                                                    ><Trash2 size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {vm.appState.folders.filter(f => !f.parentId).map(folder => renderFolderNode(folder, 0))}
                            </div>
                        )}
                    </div>
                )}

                <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Drop chat -> remove from folder
                        const chatId = e.dataTransfer.getData('application/chat-id');
                        if (chatId) vm.handleAssignToFolder(chatId, undefined, vm.allChats);

                        // Drop folder -> pull out to root level
                        const folderId = e.dataTransfer.getData('application/folder-id');
                        if (folderId) vm.handleAssignFolderToFolder(folderId, undefined);
                    }}
                    style={{ minHeight: '100px', paddingBottom: '20px' }}
                >
                    <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: vm.t.textMuted }}>
                        {vm.searchResults ? 'Search Results' : `Recent Chats (${displayChats.length})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {displayChats.length === 0 ? (
                            <div style={{ fontSize: '12px', color: vm.t.textMuted, padding: '8px', textAlign: 'center', border: `1px dashed ${vm.t.border}`, borderRadius: '6px' }}>No chats found</div>
                        ) : displayChats.map(chat => (
                            <div key={chat.id}
                                draggable
                                onDragStart={(e) => { e.dataTransfer.setData('application/chat-id', chat.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '4px 6px', position: 'relative', transition: 'background 0.15s', cursor: 'grab' }}
                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.bgHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <a href={chat.url} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textDecoration: 'none', color: vm.t.text, overflow: 'hidden', padding: '4px 2px' }}>
                                    <MessageSquare size={13} style={{ color: vm.t.textMuted, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.title}</span>
                                </a>

                                {/* Pin Button */}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); vm.handleTogglePin(chat.id, vm.allChats); }} title={chat.isPinned ? "Unpin chat" : "Pin chat"}
                                    style={{ background: 'none', border: 'none', color: chat.isPinned ? vm.t.accent : vm.t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: chat.isPinned ? 1 : 0.3, flexShrink: 0 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = chat.isPinned ? '1' : '0.3')}
                                ><Pin size={13} fill={chat.isPinned ? vm.t.accent : 'none'} /></button>

                                {/* Move to Folder button */}
                                {vm.appState!.folders.length > 0 && (
                                    <button onClick={e => { e.stopPropagation(); vm.setAssigningChatId(vm.assigningChatId === chat.id ? null : chat.id); }} title="Move to folder"
                                        style={{ background: 'none', border: 'none', color: vm.t.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.3, flexShrink: 0 }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                                    ><FolderInput size={13} /></button>
                                )}

                                {vm.assigningChatId === chat.id && (
                                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: vm.t.dropdown, border: `1px solid ${vm.t.dropdownBorder}`, borderRadius: '6px', padding: '4px', minWidth: '140px', boxShadow: `0 4px 12px ${vm.t.shadow}` }}>
                                        <div style={{ padding: '4px 8px', fontSize: '10px', color: vm.t.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Move to...</div>
                                        {/* Only show top-level folders for manual drop to not clutter. Or keep simple mapping, we just map all folders with indentation or parent name. Let's map all folders for now to avoid breaking existing feature. */}
                                        {vm.appState!.folders.map(folder => (
                                            <button key={folder.id} onClick={() => vm.handleAssignToFolder(chat.id, folder.id, vm.allChats)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: vm.t.text, cursor: 'pointer', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = vm.t.dropdownHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            ><FolderIcon size={12} style={{ color: folder.color || '#60a5fa' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span></button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {(vm.folderMenuId || vm.assigningChatId) && (
                <div onClick={() => { vm.setFolderMenuId(null); vm.setAssigningChatId(null); }} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            )}
        </div>
    );
}
