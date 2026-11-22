/**
 * The frontend's equivalent of a catch-all exception handler.
 *
 * React has no try/catch for render errors — an exception thrown while
 * rendering unmounts the entire tree and leaves a blank white page with
 * nothing in the UI to explain it. An error boundary is the only mechanism
 * that catches those, which is why this exists rather than try/catch blocks
 * scattered through the components.
 *
 * Scoped around the routed page rather than the whole app, so the sidebar and
 * header survive and the user can navigate somewhere else instead of
 * reloading.
 *
 * Note what it does *not* catch: errors inside event handlers and async code.
 * Those are handled where they happen — the pages catch failed mutations and
 * render the message — and failed API calls are logged by the RTK Query
 * middleware.
 */

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { createLogger } from "@/lib/logger";
import { Button, Card } from "@/components/ui";

const log = createLogger("error-boundary");

interface Props {
  children: ReactNode;
  /** Changing this resets the boundary — pass the route so navigating recovers. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props): void {
    // Navigating away from a broken page should clear the error, otherwise
    // the user is stuck on this screen until they reload.
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The one place a render crash is recorded. In production this is where
    // a reporting service would be called.
    log.error("Render failed and was caught by the boundary", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Card className="mt-2">
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <AlertTriangle size={28} className="text-amber-500" />
          <p className="text-sm font-medium text-slate-900">This page failed to load</p>
          <p className="max-w-md text-sm text-slate-500">
            Something went wrong while rendering. You can try again, or use the sidebar to go
            somewhere else.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-rose-700 ring-1 ring-inset ring-slate-200">
              {error.message}
            </pre>
          )}
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      </Card>
    );
  }
}
