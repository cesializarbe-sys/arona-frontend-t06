import React, { useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  isBusy?: boolean;
  zIndexClass?: string;
  panelClassName?: string;
  children: ReactNode;
}

/**
 * Accessible modal dialog primitive with Escape handling, initial focus,
 * Tab/Shift+Tab focus confinement, and focus restoration upon close.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  labelledBy,
  isBusy = false,
  zIndexClass = 'z-[120]',
  panelClassName = 'max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar',
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialogElement = dialogRef.current;

    if (dialogElement) {
      const focusables = dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogElement.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogElement) {
        const focusables = Array.from(
          dialogElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !dialogElement.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !dialogElement.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4`}>
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={!isBusy ? onClose : undefined}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative bg-white rounded-2xl shadow-2xl z-10 animate-scale-in border border-gray-100 focus:outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
};
