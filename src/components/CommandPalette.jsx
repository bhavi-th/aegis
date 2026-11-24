import { useEffect, useMemo, useRef, useState } from 'react';

function fuzzyMatch(query, text) {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase().replace(/\s+/g, '');
  if (!q) return true;
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // reset query/cursor each time the palette opens (render-time adjustment)
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) { setQuery(''); setCursor(0); }
  }

  const filtered = useMemo(
    () => commands.filter(c => fuzzyMatch(query, `${c.label} ${c.keywords || ''}`)),
    [commands, query]
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('.cp-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const run = (cmd) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[cursor]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="cp-overlay" onMouseDown={onClose}>
      <div className="cp-panel" onMouseDown={e => e.stopPropagation()}>
        <div className="cp-input-row">
          <span className="cp-prompt">▸</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Type a command — scenarios, nodes, alerts, actions…"
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
          />
          <kbd className="cp-kbd">ESC</kbd>
        </div>
        <div className="cp-list" ref={listRef}>
          {filtered.length === 0 && <div className="cp-empty">No matching commands.</div>}
          {filtered.slice(0, 12).map((c, i) => (
            <button
              key={c.id}
              className={`cp-item ${i === cursor ? 'active' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onClick={() => run(c)}
            >
              <span className="cp-icon">{c.icon || '›'}</span>
              <span className="cp-label">{c.label}</span>
              {c.hint && <span className="cp-hint">{c.hint}</span>}
            </button>
          ))}
        </div>
        <div className="cp-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> execute</span>
          <span><kbd>/</kbd> or <kbd>Ctrl K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
