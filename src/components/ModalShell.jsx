import { useEffect } from 'react';

// Single modal shell: overlay + ESC + scroll-lock + header. Replaces 5 copies.
export default function ModalShell({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} bg-elevated border border-edge rounded-2xl max-h-[calc(100vh-24px)] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 bg-elevated border-b border-edge px-5 py-4 font-semibold text-primary">
            {title}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
