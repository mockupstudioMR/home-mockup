import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { isChunkLoadError, reportError } from "@/lib/errorReporting";

type Props = {
  children: ReactNode;
  /** When this value changes, a shown error is cleared (e.g. on navigation). */
  resetKey?: string;
  /** "page" keeps the app shell usable; "app" is the last-resort full screen. */
  variant?: "page" | "app";
};

type State = { error: Error | null };

const buttonClass =
  "rounded-md px-5 py-2.5 text-sm font-medium shadow-sm transition";

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, isChunkLoadError(error) ? "chunk_load" : "render", {
      componentStack: info.componentStack?.slice(0, 1500),
      boundary: this.props.variant ?? "page",
    });
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // A new deploy replaced the code this tab was using.
    if (isChunkLoadError(error)) {
      return (
        <Fallback
          title="A new version of HomeMockUp is available"
          body="Refresh the page to load it. Your saved work is not affected."
          primary={{ label: "Refresh", onClick: () => window.location.reload() }}
          fullScreen={this.props.variant === "app"}
        />
      );
    }

    return (
      <Fallback
        title="Something went wrong on this page"
        body="The error has been recorded. You can try again, or go back to the start."
        detail={error.message}
        primary={{ label: "Try again", onClick: this.retry }}
        secondary={{ label: "Go to start", onClick: () => window.location.assign("/") }}
        fullScreen={this.props.variant === "app"}
      />
    );
  }
}

const Fallback = ({
  title,
  body,
  detail,
  primary,
  secondary,
  fullScreen,
}: {
  title: string;
  body: string;
  detail?: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  fullScreen?: boolean;
}) => (
  <div
    role="alert"
    className={`${fullScreen ? "min-h-screen" : "min-h-[60vh]"} flex items-center justify-center bg-background p-6 text-center`}
  >
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      {detail && (
        <p className="mx-auto max-w-sm break-words rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {detail}
        </p>
      )}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`}
          onClick={primary.onClick}
        >
          {primary.label}
        </button>
        {secondary && (
          <button
            type="button"
            className={`${buttonClass} border border-border bg-background hover:bg-muted`}
            onClick={secondary.onClick}
          >
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  </div>
);

/** Error boundary that resets whenever the route changes. Use inside the router. */
export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
};
