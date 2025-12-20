import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import '../styles/ErrorBoundary.css';

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
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon-wrapper">
              <AlertTriangle className="error-icon" />
            </div>
            
            <h1 className="error-title">Oops! Đã có lỗi xảy ra</h1>
            
            <p className="error-description">
              Chúng tôi xin lỗi về sự bất tiện này. Ứng dụng đã gặp lỗi không mong muốn.
            </p>

            {errorCount > 2 && (
              <div className="error-warning">
                <AlertTriangle className="w-4 h-4" />
                <span>Lỗi đang lặp lại. Vui lòng làm mới trang hoặc liên hệ hỗ trợ.</span>
              </div>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleReset} 
                className="error-btn primary"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Thử Lại</span>
              </button>
              
              <button 
                onClick={this.handleGoHome} 
                className="error-btn secondary"
              >
                <Home className="w-5 h-5" />
                <span>Về Trang Chủ</span>
              </button>
            </div>

            {/* Error details (collapsible) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>Chi tiết lỗi (Development Only)</summary>
                <div className="error-stack">
                  <p className="error-message">{error.toString()}</p>
                  {errorInfo && (
                    <pre className="error-stack-trace">
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
