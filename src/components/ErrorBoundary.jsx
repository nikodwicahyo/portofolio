import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Clear stuck errors on navigation (key/location change).
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Something went wrong
            </h1>
            <p className="text-secondary mb-6">An unexpected error occurred. You can try again without reloading.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-soft border border-edge text-primary font-medium rounded-xl hover:bg-soft-strong transition-all"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-invert text-invert-text font-medium rounded-xl hover:bg-invert-hover transition-all"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
