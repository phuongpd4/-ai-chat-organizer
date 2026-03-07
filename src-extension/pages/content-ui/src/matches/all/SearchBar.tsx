import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Fuse from 'fuse.js';
import type { ChatNode } from '@extension/shared/lib/storage';
import type { ThemeColors } from '@extension/shared/lib/theme';

interface SearchBarProps {
    chats: ChatNode[];
    onSearchResults: (results: ChatNode[] | null) => void;
    theme: ThemeColors;
}

export type PlatformFilter = 'all' | 'chatgpt' | 'claude' | 'gemini';
export type TimeFilter = 'all' | 'today' | '7days' | '30days';

export default function SearchBar({ chats, onSearchResults, theme: t }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [platform, setPlatform] = useState<PlatformFilter>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

    useEffect(() => {
        let filtered = chats;

        if (platform !== 'all') {
            filtered = filtered.filter(c => c.platform === platform);
        }

        if (timeFilter !== 'all') {
            const now = Date.now();
            const day = 24 * 60 * 60 * 1000;
            if (timeFilter === 'today') {
                filtered = filtered.filter(c => now - c.createdAt <= day);
            } else if (timeFilter === '7days') {
                filtered = filtered.filter(c => now - c.createdAt <= 7 * day);
            } else if (timeFilter === '30days') {
                filtered = filtered.filter(c => now - c.createdAt <= 30 * day);
            }
        }

        if (!query.trim()) {
            if (platform === 'all' && timeFilter === 'all') {
                onSearchResults(null);
            } else {
                onSearchResults(filtered);
            }
            return;
        }

        const fuse = new Fuse(filtered, {
            keys: ['title'],
            threshold: 0.4,
            includeMatches: true,
            ignoreLocation: true
        });

        const results = fuse.search(query).map(r => ({
            ...r.item,
            highlightIndices: r.matches?.find(m => m.key === 'title')?.indices
        }));

        onSearchResults(results);
    }, [query, platform, timeFilter, chats]); // Removed onSearchResults from dependency to avoid infinite loops if function ref changes

    const clearFilters = () => {
        setPlatform('all');
        setTimeFilter('all');
        setShowFilters(false);
    };

    const hasFilters = platform !== 'all' || timeFilter !== 'all';

    return (
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: t.textMuted }} />
                    <input
                        type="text" value={query} onChange={e => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                        placeholder="Search chats..."
                        style={{
                            width: '100%', borderRadius: '6px', background: t.bgInput,
                            border: `1px solid ${isFocused ? t.borderFocus : t.border}`,
                            padding: '6px 8px 6px 30px', fontSize: '12px', color: t.textHeading,
                            outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                        }}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '6px', top: '8px', background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: 0 }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    title="Filters"
                    style={{
                        background: hasFilters || showFilters ? t.accent : t.bgInput,
                        border: `1px solid ${hasFilters || showFilters ? t.accent : t.border}`,
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: hasFilters || showFilters ? '#fff' : t.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <Filter size={14} />
                </button>
            </div>

            {/* Filter Dropdown Area */}
            {showFilters && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: t.dropdown, border: `1px solid ${t.dropdownBorder}`,
                    borderRadius: '6px', padding: '8px', zIndex: 100,
                    boxShadow: `0 4px 12px ${t.shadow}`,
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: t.textMuted, textTransform: 'uppercase' }}>Filter Search</span>
                        {hasFilters && (
                            <button onClick={clearFilters} style={{ background: 'none', border: 'none', fontSize: '10px', color: t.danger, cursor: 'pointer', padding: 0 }}>Clear all</button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: t.text }}>Platform:</span>
                        <select
                            value={platform}
                            onChange={e => setPlatform(e.target.value as PlatformFilter)}
                            style={{
                                width: '100%', padding: '4px 6px', fontSize: '12px',
                                background: t.bgInput, color: t.text, border: `1px solid ${t.border}`, borderRadius: '4px', outline: 'none'
                            }}
                        >
                            <option value="all">All Platforms</option>
                            <option value="chatgpt">ChatGPT</option>
                            <option value="claude">Claude</option>
                            <option value="gemini">Gemini</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: t.text }}>Time:</span>
                        <select
                            value={timeFilter}
                            onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                            style={{
                                width: '100%', padding: '4px 6px', fontSize: '12px',
                                background: t.bgInput, color: t.text, border: `1px solid ${t.border}`, borderRadius: '4px', outline: 'none'
                            }}
                        >
                            <option value="all">Any time</option>
                            <option value="today">Today</option>
                            <option value="7days">Last 7 days</option>
                            <option value="30days">Last 30 days</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
