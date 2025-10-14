import { useEffect } from 'react';

export default function UndoRedo({ onUndo, onRedo, canUndo, canRedo }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && onUndo) {
          onUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo && onRedo) {
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo]);

  return (
    <div className="undo-redo-toolbar">
      <button
        className="btn-secondary"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        className="btn-secondary"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>

      <style jsx>{`
        .undo-redo-toolbar {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          padding: 5px;
          background: var(--bg-window);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .undo-redo-toolbar button {
          min-width: 80px;
        }
      `}</style>
    </div>
  );
}