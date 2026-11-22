import React from 'react';
import { ModalDialog } from './ModalDialog';

export type ConfirmModalType = 'danger' | 'warning' | 'success' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const getIconName = (): string => {
    switch (type) {
      case 'danger':
        return 'delete_outline';
      case 'warning':
        return 'warning_amber';
      case 'success':
        return 'restore_from_trash';
      default:
        return 'info';
    }
  };

  const getIconBg = (): string => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'success':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-sky-100 text-sky-600';
    }
  };

  const getConfirmBtnClass = (): string => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20';
      default:
        return 'bg-[var(--color-arona-500)] hover:bg-[var(--color-arona-600)] text-white shadow-md shadow-emerald-700/20';
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onCancel}
      labelledBy="confirm-modal-title"
      isBusy={isLoading}
      zIndexClass="z-[150]"
      panelClassName="max-w-md w-full p-6"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg()}`}
        >
          <span className="material-icons-outlined text-2xl">{getIconName()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3
            id="confirm-modal-title"
            className="text-lg font-bold text-[var(--color-text-primary)]"
          >
            {title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="arona-btn-outline text-sm py-2 px-4 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`text-sm py-2 px-5 rounded-xl font-semibold border-none cursor-pointer transition-all duration-200 flex items-center gap-2 ${getConfirmBtnClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading && (
            <span className="material-icons-outlined text-base animate-spin">refresh</span>
          )}
          {confirmText}
        </button>
      </div>
    </ModalDialog>
  );
};
