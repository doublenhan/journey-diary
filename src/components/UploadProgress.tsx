

export interface UploadProgressItem {
  id: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgressProps {
  items: UploadProgressItem[];
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function UploadProgress({ items, onRetry, onCancel }: UploadProgressProps) {
  const totalProgress = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length)
    : 0;

  const successCount = items.filter(i => i.status === 'success').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const uploadingCount = items.filter(i => i.status === 'uploading').length;

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_4px_12px_rgba(236,72,153,0.1)] border border-pink-200/20 mb-6">
      {/* Overall Progress */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-[15px]">
          {uploadingCount > 0 && (
            <>
              <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              <span>Đang tải lên {uploadingCount} ảnh...</span>
            </>
          )}
          {uploadingCount === 0 && errorCount === 0 && (
            <>
              <span className="text-green-500 text-xl font-bold">✓</span>
              <span>Tải lên hoàn tất!</span>
            </>
          )}
          {uploadingCount === 0 && errorCount > 0 && (
            <>
              <span className="text-red-500 text-xl">⚠</span>
              <span>Có {errorCount} ảnh thất bại</span>
            </>
          )}
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {successCount}/{items.length} ảnh
        </div>
      </div>

      {/* Total Progress Bar */}
      <div className="w-full h-2 bg-pink-500/10 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all duration-300"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Individual Items */}
      <div className="max-h-[300px] overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-pink-500/30 scrollbar-track-black/5 hover:scrollbar-thumb-pink-500/50">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
            item.status === 'uploading' ? 'bg-pink-500/5 border border-pink-500/20' : 
            item.status === 'success' ? 'bg-green-500/5 border border-green-500/20' :
            item.status === 'error' ? 'bg-red-500/5 border border-red-500/20' :
            'bg-gray-50'
          }`}>
            <div className="w-6 h-6 flex items-center justify-center text-base flex-shrink-0">
              {item.status === 'pending' && '⏳'}
              {item.status === 'uploading' && <div className="w-3.5 h-3.5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />}
              {item.status === 'success' && <span className="text-green-500 font-bold">✓</span>}
              {item.status === 'error' && <span className="text-red-500 font-bold">✗</span>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1">{item.filename}</div>
              {item.error && (
                <div className="text-xs text-red-500 mb-1">{item.error}</div>
              )}
              <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.status === 'success' ? 'bg-green-500' :
                    item.status === 'error' ? 'bg-red-500' :
                    'bg-gradient-to-r from-pink-500 to-pink-400'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-1">
              {item.status === 'error' && onRetry && (
                <button
                  onClick={() => onRetry(item.id)}
                  className="w-7 h-7 rounded-md border-none bg-black/5 text-gray-500 text-base cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-pink-500/10 hover:text-pink-500"
                  title="Thử lại"
                >
                  ↻
                </button>
              )}
              {(item.status === 'pending' || item.status === 'uploading') && onCancel && (
                <button
                  onClick={() => onCancel(item.id)}
                  className="w-7 h-7 rounded-md border-none bg-black/5 text-gray-500 text-base cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                  title="Hủy"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
