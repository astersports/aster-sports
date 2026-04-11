import { Component } from 'react';

// Root-level error boundary. Catches synchronous render errors anywhere
// below it and shows a refresh prompt instead of a white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--sf-bg-page)' }}
      >
        <div className="text-center">
          <h1
            className="font-semibold"
            style={{ color: 'var(--sf-text-primary)', fontSize: 20, marginBottom: 8 }}
          >
            Something went wrong
          </h1>
          <p style={{ color: 'var(--sf-text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-semibold sf-press"
            style={{
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 10,
              backgroundColor: 'var(--sf-accent)',
              color: 'var(--sf-text-inverse)',
              fontSize: 15,
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}
