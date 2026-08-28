import React, { useEffect } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { cn } from '@/lib/utils';

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-[#181b20] border border-white/10 text-white shadow-2xl transition-all animate-in zoom-in-95 duration-200',
          className
        )}>
        {/* Modal Sticky Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-[#181b20]">
          {title && <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center size-8 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Scrollable Modal Content Body (Inset Scrollbar with rounded bounds) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
          {children}
        </div>
      </div>
    </div>
  );
}
