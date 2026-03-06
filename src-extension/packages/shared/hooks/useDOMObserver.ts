import { useEffect, useState, useCallback } from 'react';

interface ChatHistoryItem {
    id: string;
    title: string;
    href: string;
}

/**
 * Phát hiện platform hiện tại dựa trên hostname
 */
function detectPlatform(): 'chatgpt' | 'claude' | 'gemini' | 'unknown' {
    const host = window.location.hostname;
    if (host.includes('chatgpt.com')) return 'chatgpt';
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
}

/**
 * Cấu hình selector cho từng platform. 
 * Mỗi platform có cấu trúc DOM khác nhau, cần dùng selector khác nhau.
 * Khi platform cập nhật UI, chỉ cần sửa ở đây.
 */
const PLATFORM_SELECTORS: Record<string, string[]> = {
    chatgpt: [
        // ChatGPT - thử nhiều selector khả thi
        'nav a[href^="/c/"]',                    // Link trỏ tới conversation /c/xxx
        'nav a[href^="/g/"]',                    // Link GPT conversations /g/xxx
        'nav ol li a',                           // Cấu trúc list cũ
        'nav li a[href*="/c/"]',                 // Li > a pattern
        'a[data-testid*="conversation"]',        // Data-testid attribute
    ],
    claude: [
        // Claude.ai
        'a[href^="/chat/"]',                     // Link trỏ tới chat
        'nav a[href*="/chat/"]',                 // Nav > a pattern
        '[data-testid="conversation-link"]',     // Data-testid
        'aside a[href*="/chat/"]',              // Aside sidebar links
    ],
    gemini: [
        // Gemini
        'a[href*="/app/"]',                      // Link pattern Gemini
        'mat-list a',                            // Material list links
        '[role="listbox"] a',                    // Listbox pattern
    ],
};

/**
 * Trích xuất chat items từ DOM dựa trên platform-specific selectors.
 * Thử lần lượt từng selector cho đến khi tìm thấy kết quả.
 */
function extractChatItems(platform: string): ChatHistoryItem[] {
    const selectors = PLATFORM_SELECTORS[platform] || [];

    for (const selector of selectors) {
        try {
            const items = document.querySelectorAll(selector);
            if (items.length === 0) continue;

            const results: ChatHistoryItem[] = [];
            const seenIds = new Set<string>();

            for (const el of Array.from(items)) {
                const anchor = el as HTMLAnchorElement;
                const href = anchor.getAttribute('href') || anchor.href || '';

                // Bỏ qua nếu không phải link hợp lệ
                if (!href || href === '#' || href === '/') continue;

                // Lấy title: ưu tiên textContent của element
                const title = anchor.textContent?.trim() || 'Untitled Chat';

                // Bỏ qua nếu title quá ngắn (có thể là icon text)
                if (title.length < 2) continue;

                // Trích xuất ID từ URL path
                const pathSegments = href.split('/').filter(Boolean);
                const id = pathSegments[pathSegments.length - 1] || `chat_${Date.now()}_${Math.random()}`;

                // Loại bỏ trùng lặp
                if (seenIds.has(id)) continue;
                seenIds.add(id);

                results.push({ id, title, href });
            }

            if (results.length > 0) {
                console.log(`[AI Chat Org] Found ${results.length} chats using selector: ${selector}`);
                return results;
            }
        } catch (e) {
            // Selector không hợp lệ hoặc lỗi khác, bỏ qua và thử selector tiếp theo
            continue;
        }
    }

    // Fallback: thử quét tất cả anchor links có href dạng chat/conversation
    try {
        const allLinks = document.querySelectorAll('a[href]');
        const chatPattern = /\/(c|chat|g|app)\//;
        const results: ChatHistoryItem[] = [];
        const seenIds = new Set<string>();

        for (const link of Array.from(allLinks)) {
            const anchor = link as HTMLAnchorElement;
            const href = anchor.getAttribute('href') || '';

            if (!chatPattern.test(href)) continue;

            const title = anchor.textContent?.trim() || 'Untitled Chat';
            if (title.length < 2 || title.length > 200) continue;

            const pathSegments = href.split('/').filter(Boolean);
            const id = pathSegments[pathSegments.length - 1] || `chat_${Date.now()}`;

            if (seenIds.has(id)) continue;
            seenIds.add(id);

            results.push({ id, title, href });
        }

        if (results.length > 0) {
            console.log(`[AI Chat Org] Found ${results.length} chats using fallback pattern`);
            return results;
        }
    } catch (e) {
        // ignore
    }

    return [];
}

/**
 * Hook để parse DOM của trang AI Chat và lấy các item Chat History.
 * Hỗ trợ ChatGPT, Claude.ai, và Gemini.
 * Tự động retry khi trang chưa load xong sidebar.
 */
export function useDOMObserver() {
    const [chatItems, setChatItems] = useState<ChatHistoryItem[]>([]);
    const platform = detectPlatform();

    const parseChatItems = useCallback(() => {
        const items = extractChatItems(platform);
        setChatItems(prev => {
            // Chỉ cập nhật state nếu dữ liệu thực sự thay đổi
            if (prev.length === items.length &&
                prev.every((p, i) => p.id === items[i]?.id)) {
                return prev;
            }
            return items;
        });
    }, [platform]);

    useEffect(() => {
        // Lần đầu: Retry nhiều lần vì sidebar có thể chưa load xong
        let retryCount = 0;
        const maxRetries = 10;
        const retryDelay = 1500; // ms

        const retryParse = () => {
            parseChatItems();
            retryCount++;
            if (retryCount < maxRetries) {
                setTimeout(retryParse, retryDelay);
            }
        };

        // Bắt đầu parse sau khi DOM ổn định
        setTimeout(retryParse, 500);

        // MutationObserver - debounced
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                parseChatItems();
            }, 300);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [parseChatItems]);

    return chatItems;
}
