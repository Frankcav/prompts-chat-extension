import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
            An unexpected error occurred. Try refreshing or reloading the extension.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Try again
            </Button>
            <Button size="sm" onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Reload
            </Button>
          </div>
          {this.state.error && (
            <details className="mt-6 text-xs text-muted-foreground max-w-full">
              <summary className="cursor-pointer hover:text-foreground">Error details</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32 max-w-[300px]">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
