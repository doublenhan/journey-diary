import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external service (if needed)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="max-w-[600px] w-full bg-white rounded-3xl py-12 px-8 shadow-[0_20px_40px_rgba(236,72,153,0.15)] text-center animate-slideUp">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-6 animate-pulse">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-700 mb-4">Oops! Đã có lỗi xảy ra</h1>
            
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Chúng tôi xin lỗi về sự bất tiện này. Ứng dụng đã gặp lỗi không mong muốn.
            </p>

            {errorCount > 2 && (
              <div className="flex items-center justify-center gap-3 py-4 px-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-yellow-900 text-sm font-medium mb-6">
                <AlertTriangle className="w-4 h-4" />
                <span>Lỗi đang lặp lại. Vui lòng làm mới trang hoặc liên hệ hỗ trợ.</span>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <button 
                onClick={this.handleReset} 
                className="inline-flex items-center gap-3 py-4 px-8 border-none rounded-2xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-gradient-to-br from-pink-500 to-pink-700 text-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Thử Lại</span>
              </button>
              
              <button 
                onClick={this.handleGoHome} 
                className="inline-flex items-center gap-3 py-4 px-8 border-2 border-gray-200 rounded-2xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-white text-gray-700 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-gray-50 hover:border-gray-300"
              >
                <Home className="w-5 h-5" />
                <span>Về Trang Chủ</span>
              </button>
            </div>

            {/* Error details (collapsible) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-8 text-left bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
                <summary className="cursor-pointer font-semibold text-gray-700 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100">Chi tiết lỗi (Development Only)</summary>
                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                  <p className="text-sm text-red-600 font-semibold mb-4 p-3 bg-red-100 rounded-lg">{error.toString()}</p>
                  {errorInfo && (
                    <pre className="text-xs text-gray-200 bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-words font-mono">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher Order Component for wrapping components with Error Boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
