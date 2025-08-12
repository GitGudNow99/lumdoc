'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Message } from 'ai';

interface ExportButtonProps {
  messages: Message[];
  version?: string;
  className?: string;
}

export function ExportButton({ messages, version = '2.3', className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (messages.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, version }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grandma3-chat-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chat. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || messages.length === 0}
      className={className || "flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"}
      title="Export chat as PDF"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}