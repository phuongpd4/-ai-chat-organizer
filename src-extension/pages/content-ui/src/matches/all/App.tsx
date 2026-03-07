import { useState, useEffect } from 'react';
import SidebarContainer from './SidebarContainer';
import { useMessageObserver } from '@extension/shared/hooks/useMessageObserver';

export default function App() {
  useMessageObserver();

  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // Kiểm tra trạng thái bật/tắt từ storage
  useEffect(() => {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      setIsEnabled(result.extensionEnabled !== false);
    });

    // Lắng nghe thay đổi từ popup toggle
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.extensionEnabled) {
        setIsEnabled(changes.extensionEnabled.newValue !== false);
      }
    });
  }, []);

  // Chặn tất cả keyboard events khỏi bubble lên trang gốc (ChatGPT/Claude)
  const stopKeyboardPropagation = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  // Nếu extension bị tắt → không render gì
  if (!isEnabled) return null;

  return (
    <div
      onKeyDown={stopKeyboardPropagation}
      onKeyUp={stopKeyboardPropagation}
      onKeyPress={stopKeyboardPropagation}
    >
      {/* Nút Toggle Floating */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          left: isOpen ? '288px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2147483647,
          width: '28px',
          height: '64px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '2px 0 12px rgba(0,0,0,0.3)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        title={isOpen ? 'Close AI Chat Organizer' : 'Open AI Chat Organizer'}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Sidebar Panel */}
      <div
        style={{
          position: 'fixed',
          left: isOpen ? '0' : '-288px',
          top: '0',
          height: '100vh',
          width: '288px',
          zIndex: 2147483646,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <SidebarContainer />
      </div>
    </div>
  );
}
