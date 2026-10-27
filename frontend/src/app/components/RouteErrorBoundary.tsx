import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

export interface RouteErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isRoot?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryKey: number;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    retryKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    console.error(`[RouteErrorBoundary] Uncaught runtime error at route "${currentPath}":`, error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryKey: prev.retryKey + 1,
    }));
  };

  private handleGoDashboard = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV || process.env.NODE_ENV !== 'production';
      const title = this.props.fallbackTitle || (this.props.isRoot ? 'Application Error' : 'Unable to load page');
      const message =
        this.props.fallbackMessage ||
        'An unexpected error occurred while rendering this section. Your session and navigation remain active.';

      return (
        <div
          data-testid="route-error-boundary-fallback"
          className={`w-full flex items-center justify-center p-6 ${
            this.props.isRoot ? 'min-h-screen bg-slate-50' : 'min-h-[400px]'
          }`}
        >
          <div className="max-w-xl w-full bg-white rounded-xl border border-red-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button onClick={this.handleReset} variant="outline" className="border-slate-300">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button onClick={this.handleGoDashboard} className="bg-green-700 hover:bg-green-800 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go to dashboard
              </Button>
            </div>

            {/* In Development: Display error message and stack */}
            {isDev && this.state.error && (
              <div className="text-left pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 focus:outline-none"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {this.state.showDetails ? 'Hide technical details' : 'Show technical error details (dev mode)'}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 bg-slate-900 text-red-300 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-60 space-y-2">
                    <p className="font-bold text-red-200">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-slate-400 whitespace-pre-wrap text-[11px] leading-tight">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.retryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
