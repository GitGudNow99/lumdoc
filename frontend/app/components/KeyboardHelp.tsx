'use client';

import { X } from 'lucide-react';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['/', 'Cmd+K'], description: 'Focus search input' },
  { keys: ['Esc'], description: 'Close dialogs / Clear search' },
  { keys: ['↑', '↓'], description: 'Navigate suggestions' },
  { keys: ['Enter'], description: 'Submit search / Select suggestion' },
  { keys: ['Cmd+Enter'], description: 'Submit message' },
  { keys: ['Cmd+N'], description: 'New chat session' },
  { keys: ['Cmd+Shift+K'], description: 'Clear chat history' },
  { keys: ['?'], description: 'Show this help' },
];

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-b-0"
            >
              <span className="text-sm text-zinc-400">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    {keyIndex > 0 && <span className="text-zinc-600">/</span>}
                    <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}