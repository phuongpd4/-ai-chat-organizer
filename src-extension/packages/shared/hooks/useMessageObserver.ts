import { useEffect } from 'react';
import { getStorageData, saveBookmarks, BookmarkNode } from '../lib/storage';

function detectPlatform(): 'chatgpt' | 'claude' | 'gemini' | 'unknown' {
    const host = window.location.hostname;
    if (host.includes('chatgpt.com')) return 'chatgpt';
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
}

function getMessageSelectors(platform: string): { messageBlock: string, actionContainer: string } {
    switch (platform) {
        case 'chatgpt':
            // ChatGPT Assistant Messages
            return {
                messageBlock: 'div[data-message-author-role="assistant"]',
                actionContainer: 'div.flex.items-center.justify-start' // Class name to append action buttons
            };
        case 'claude':
            return {
                messageBlock: 'div.font-claude-message[data-is-user="false"], div.font-user-message',
                actionContainer: 'div.flex.gap-2.text-text-500' // Target the action bar
            };
        case 'gemini':
            return {
                messageBlock: 'message-content', // Gemini structure
                actionContainer: 'div.bottom-row'
            };
        default:
            return { messageBlock: '', actionContainer: '' };
    }
}

/**
 * Hook quét DOM liên tục để tìm các "bong bóng tin nhắn" mới sinh ra
 * và chèn nút "🔖 Bookmark" vào đó
 */
export function useMessageObserver() {
    useEffect(() => {
        const platform = detectPlatform();
        if (platform === 'unknown') return;

        const selectors = getMessageSelectors(platform);
        if (!selectors.messageBlock) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const injectBookmarkButtons = async () => {
            const blocks = document.querySelectorAll(`${selectors.messageBlock}:not([data-bm-injected])`);
            if (blocks.length === 0) return;

            const storage = await getStorageData();
            let currentBookmarks = storage.bookmarks || [];

            blocks.forEach(block => {
                block.setAttribute('data-bm-injected', 'true');

                // Tạo button
                const btn = document.createElement('button');
                btn.innerHTML = '🔖 Bookmark';
                btn.title = 'Bookmark this message';
                btn.style.cssText = `
                    background: transparent;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 11px;
                    padding: 4px 8px;
                    margin-left: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s;
                `;

                btn.onmouseenter = () => { btn.style.color = '#3b82f6'; btn.style.borderColor = '#3b82f6'; };
                btn.onmouseleave = () => { btn.style.color = '#6b7280'; btn.style.borderColor = '#e5e7eb'; };

                btn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Lấy ID chat hiện tại từ URL
                    const pathSegments = window.location.pathname.split('/').filter(Boolean);
                    const chatId = pathSegments[pathSegments.length - 1] || 'unknown-chat';

                    // Trích xuất text (khoảng 100 chữ đầu)
                    const fullText = block.textContent || '';
                    const excerpt = fullText.substring(0, 150) + (fullText.length > 150 ? '...' : '');

                    const newBm: BookmarkNode = {
                        id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        chatId,
                        textExcerpt: excerpt,
                        url: window.location.href, // Lấy current message hash if possible, fallback href
                        createdAt: Date.now()
                    };

                    const freshestStorage = await getStorageData();
                    const newBookmarks = [...freshestStorage.bookmarks, newBm];
                    await saveBookmarks(newBookmarks);

                    btn.innerHTML = '✅ Bookmark';
                    btn.style.color = '#10b981';
                    btn.style.borderColor = '#10b981';
                    setTimeout(() => {
                        btn.innerHTML = '🔖 Bookmark';
                        btn.style.color = '#6b7280';
                        btn.style.borderColor = '#e5e7eb';
                    }, 2000);
                };

                // Inject strategy vary by platform
                if (platform === 'chatgpt') {
                    // Try to append after the text block, or within action container
                    const parentTree = block.parentElement?.parentElement;
                    const actionGroup = parentTree?.querySelector('div.flex.items-center.justify-start') || block;
                    actionGroup.appendChild(btn);
                } else if (platform === 'claude') {
                    // Claude inject
                    block.appendChild(btn);
                } else {
                    block.appendChild(btn);
                }
            });
        };

        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                injectBookmarkButtons();
            }, 500);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // First initial check
        setTimeout(injectBookmarkButtons, 1000);

        return () => {
            observer.disconnect();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, []);
}
