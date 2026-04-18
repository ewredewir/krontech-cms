'use client';
import { useRef } from 'react';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  locale: 'tr' | 'en';
  rows?: number;
}

export function RichTextEditor({ label, value, onChange, locale, rows = 8 }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} <span className="text-gray-400 uppercase text-xs">{locale}</span>
      </label>
      <div className="border border-gray-300 focus-within:border-primary">
        <div className="flex gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          <button type="button" onClick={() => insertMarkdown('**', '**')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100 font-bold">B</button>
          <button type="button" onClick={() => insertMarkdown('*', '*')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100 italic">I</button>
          <button type="button" onClick={() => insertMarkdown('## ')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100">H2</button>
          <button type="button" onClick={() => insertMarkdown('### ')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100">H3</button>
          <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100">Link</button>
          <button type="button" onClick={() => insertMarkdown('- ')} className="px-2 py-0.5 text-xs border border-gray-300 bg-white hover:bg-gray-100">List</button>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 text-sm font-mono resize-y focus:outline-none"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">Markdown supported</p>
    </div>
  );
}
