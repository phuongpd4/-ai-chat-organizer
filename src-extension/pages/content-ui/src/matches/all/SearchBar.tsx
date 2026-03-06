import { useState } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import type { ChatNode } from '@extension/shared/lib/storage';
import type { ThemeColors } from '@extension/shared/lib/theme';

interface SearchBarProps {
    chats: ChatNode[];
    onSearchResults: (results: ChatNode[] | null) => void;
    theme: ThemeColors;
}

export default function SearchBar({ chats, onSearchResults, theme: t }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (!val.trim()) { onSearchResults(null); return; }

        const fuse = new Fuse(chats, { keys: ['title', 'platform'], threshold: 0.4 });
        const results = fuse.search(val).map((r: import('fuse.js').FuseResult<ChatNode>) => r.item);
        onSearchResults(results);
    };

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: t.textMuted }} />
            <input
                type="text" value={query} onChange={handleSearch}
                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                placeholder="Search chats..."
                style={{
                    width: '100%', borderRadius: '6px', background: t.bgInput,
                    border: `1px solid ${isFocused ? t.borderFocus : t.border}`,
                    padding: '6px 8px 6px 30px', fontSize: '12px', color: t.textHeading,
                    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
            />
        </div>
    );
}
