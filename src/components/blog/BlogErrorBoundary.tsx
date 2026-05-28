import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; label?: string }
interface State { hasError: boolean; message?: string }

/**
 * Localized error boundary used to wrap optional blog sub-sections
 * (TOC, schemas, tables, FAQ) so a single faulty block cannot blank
 * out the entire article page.
 */
export class BlogErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn(`[BlogErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

export default BlogErrorBoundary;
