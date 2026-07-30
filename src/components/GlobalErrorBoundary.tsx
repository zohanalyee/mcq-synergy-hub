import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BrandMark from '@/components/BrandMark';

interface Props {
  children: ReactNode;
  /** Changing this value resets the boundary (e.g. on route change). */
  resetKey?: string;
  /** Optional label used in the logged error for easier debugging. */
  scope?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * App-wide crash guard.
 *
 * Any uncaught render/lifecycle error below this boundary shows a branded
 * "something went wrong" screen with recovery actions instead of a blank
 * white page. Resets automatically when `resetKey` changes.
 */
class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[GlobalErrorBoundary${this.props.scope ? `:${this.props.scope}` : ''}]`,
      error,
      info?.componentStack,
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  private handleHome = () => {
    if (typeof window !== 'undefined') window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-[70dvh] flex items-center justify-center px-4 py-10"
      >
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-6 text-center space-y-4">
            <BrandMark className="justify-center" />

            <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground" dir="rtl">
                کچھ غلط ہو گیا — دوبارہ کوشش کریں
              </p>
              <p className="text-sm text-muted-foreground">
                This page hit an unexpected error. Your account and saved
                results are safe.
              </p>
            </div>

            {this.state.message && (
              <p className="text-xs text-muted-foreground/80 bg-muted rounded-md px-3 py-2 break-words">
                {this.state.message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                onClick={this.handleRetry}
                className="flex-1 min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={this.handleReload}
                className="flex-1 min-h-[44px]"
              >
                Reload page
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={this.handleHome}
              className="w-full min-h-[44px]"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
