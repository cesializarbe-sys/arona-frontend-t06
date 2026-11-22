import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface UseDisclosureFocusOptions {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
}

/**
 * Accessible focus management for disclosure popovers/panels:
 * - Moves focus into the panel (first focusable or panel itself) when opened.
 * - Closes on Escape and when focus leaves the panel/trigger region.
 * - Restores focus to the trigger button whenever the panel closes.
 */
export function useDisclosureFocus({
  isOpen,
  onClose,
  triggerRef,
  panelRef,
}: UseDisclosureFocusOptions): void {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      const panel = panelRef.current;
      if (panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          panel.focus();
        }
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus();
      }
    }
  }, [isOpen, panelRef, triggerRef]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      const insidePanel = panel ? panel.contains(target) : false;
      const insideTrigger = trigger ? trigger.contains(target) : false;
      if (!insidePanel && !insideTrigger) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [isOpen, onClose, panelRef, triggerRef]);
}
