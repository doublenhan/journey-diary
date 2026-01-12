import { useLanguage } from '../hooks/useLanguage';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-[fade-in_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[slideUp_0.4s_ease-out]">
        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 text-lg">{message}</p>
        </div>
        <div className="bg-white border-t-2 border-gray-100 p-6 rounded-b-2xl flex gap-4">
          <button
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            onClick={onClose}
          >
            {cancelText || t('common.cancel') || 'Hủy'}
          </button>
          <button
            className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            onClick={handleConfirm}
          >
            {confirmText || t('common.delete') || 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
