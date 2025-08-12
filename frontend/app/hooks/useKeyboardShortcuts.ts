import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const metaMatch = shortcut.meta ? event.metaKey : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault();
        shortcut.handler();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  SEARCH: { key: '/', description: 'Focus search' },
  ESCAPE: { key: 'Escape', description: 'Close/Cancel' },
  NEW_CHAT: { key: 'n', ctrl: true, description: 'New chat' },
  CLEAR: { key: 'k', ctrl: true, description: 'Clear messages' },
  HELP: { key: '?', shift: true, description: 'Show help' },
  SUBMIT: { key: 'Enter', ctrl: true, description: 'Submit' },
} as const;