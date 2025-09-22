import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo || {}
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600">We encountered an unexpected error. Please try one of the options below.</p>
            </div>

            <div className="space-y-4 mb-6">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                🔄 Reload Page
              </button>
              
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium"
              >
                🏠 Go to Dashboard
              </button>
              
              <button 
                onClick={() => window.location.href = '/register'} 
                className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
              >
                📝 Go to Registration
              </button>
            </div>

            <details className="text-sm text-gray-600 border-t pt-4">
              <summary className="cursor-pointer mb-3 font-medium text-gray-700 hover:text-gray-900">
                🔍 Technical Details (for developers)
              </summary>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-3">
                  <strong className="text-gray-700">Error:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                    {this.state.error ? this.state.error.toString() : 'Unknown error occurred'}
                  </pre>
                </div>
                
                <div>
                  <strong className="text-gray-700">Stack Trace:</strong>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {this.state.errorInfo && this.state.errorInfo.componentStack 
                      ? this.state.errorInfo.componentStack 
                      : 'No stack trace available'}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
