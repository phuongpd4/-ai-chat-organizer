import { useEffect, useState } from 'react';
import { getTheme, getSavedTheme, saveTheme, ThemeMode, ThemeColors } from '@extension/shared/lib/theme';

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const t: ThemeColors = getTheme(themeMode);

  useEffect(() => {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      setIsEnabled(result.extensionEnabled !== false);
    });
    getSavedTheme().then(setThemeMode);
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ extensionEnabled: newState });
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && (tab.url.includes('chatgpt.com') || tab.url.includes('claude.ai') || tab.url.includes('gemini.google.com'))) {
          chrome.tabs.reload(tab.id!);
        }
      }
    });
  };

  const handleThemeToggle = () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    saveTheme(next);
  };

  return (
    <div style={{ width: '280px', background: t.bg, color: t.text, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>A</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: t.textHeading }}>AI Chat Organizer</div>
          <div style={{ fontSize: '11px', color: t.textMuted }}>v0.5.0</div>
        </div>
        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ background: 'none', border: `1px solid ${t.border}`, borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', color: t.textSecondary, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {themeMode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Toggle Extension */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>Extension</div>
            <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>{isEnabled ? 'Active on AI platforms' : 'Disabled'}</div>
          </div>
          <button onClick={handleToggle} style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: isEnabled ? t.accent : t.indicator, cursor: 'pointer', transition: 'background 0.2s', padding: 0 }}>
            <div style={{ position: 'absolute', top: '2px', left: isEnabled ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
      </div>

      {/* Platforms */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: '11px', color: t.textMuted, textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Supported Platforms</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[{ name: 'ChatGPT', domain: 'chatgpt.com' }, { name: 'Claude', domain: 'claude.ai' }, { name: 'Gemini', domain: 'gemini.google.com' }].map(p => (
            <div key={p.domain} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', background: t.bgSecondary }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isEnabled ? t.accent : t.indicator }} />
              <span style={{ fontSize: '12px', color: t.text, flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: '10px', color: t.textMuted }}>{p.domain}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Popup;

