import '../styles/UploadProgress.css';

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
    <div className="upload-progress-container">
      {/* Overall Progress */}
      <div className="upload-progress-header">
        <div className="upload-progress-title">
          {uploadingCount > 0 && (
            <>
              <div className="upload-spinner" />
              <span>Đang tải lên {uploadingCount} ảnh...</span>
            </>
          )}
          {uploadingCount === 0 && errorCount === 0 && (
            <>
              <span className="upload-check">✓</span>
              <span>Tải lên hoàn tất!</span>
            </>
          )}
          {uploadingCount === 0 && errorCount > 0 && (
            <>
              <span className="upload-error-icon">⚠</span>
              <span>Có {errorCount} ảnh thất bại</span>
            </>
          )}
        </div>
        <div className="upload-progress-stats">
          {successCount}/{items.length} ảnh
        </div>
      </div>

      {/* Total Progress Bar */}
      <div className="upload-progress-bar-container">
        <div 
          className="upload-progress-bar"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Individual Items */}
      <div className="upload-items-list">
        {items.map((item) => (
          <div key={item.id} className={`upload-item upload-item-${item.status}`}>
            <div className="upload-item-icon">
              {item.status === 'pending' && '⏳'}
              {item.status === 'uploading' && <div className="upload-spinner-small" />}
              {item.status === 'success' && '✓'}
              {item.status === 'error' && '✗'}
            </div>
            
            <div className="upload-item-content">
              <div className="upload-item-filename">{item.filename}</div>
              {item.error && (
                <div className="upload-item-error">{item.error}</div>
              )}
              <div className="upload-item-progress-bar">
                <div 
                  className="upload-item-progress-fill"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>

            <div className="upload-item-actions">
              {item.status === 'error' && onRetry && (
                <button
                  onClick={() => onRetry(item.id)}
                  className="upload-item-retry"
                  title="Thử lại"
                >
                  ↻
                </button>
              )}
              {(item.status === 'pending' || item.status === 'uploading') && onCancel && (
                <button
                  onClick={() => onCancel(item.id)}
                  className="upload-item-cancel"
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
