import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

export function Sheet({
  open,
  onClose,
  children,
  footer,
  top,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  top?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 h-full w-full animate-fade-in bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] animate-sheet-in">
        <div className="pointer-events-auto flex max-h-[93vh] flex-col overflow-hidden rounded-t-[26px] border-t border-line bg-surface shadow-sheet">
          <div className="relative flex items-center justify-center pb-1 pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#33333C]" />
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-3 top-1 rounded-full p-1.5 text-sub active:bg-chip"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          {top}
          <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
          {footer && (
            <div className="safe-b border-t border-line bg-surface px-4 pb-3 pt-3">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
