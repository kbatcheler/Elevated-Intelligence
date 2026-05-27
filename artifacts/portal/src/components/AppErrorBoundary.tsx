import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { error: Error | null; info: ErrorInfo | null };

/**
 * Top-level error boundary. Without it, any render-time throw inside App
 * unmounts the root and the user is left staring at the body's cream
 * background with no signal. Renders a navy diagnostic card instead so the
 * failure is visible and the error message is recoverable from the page.
 */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const stack = this.state.info?.componentStack ?? "";
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "var(--navy-deep, #0F1A33)" }}
      >
        <div
          className="max-w-[640px] w-full p-8 rounded-sm"
          style={{
            background: "var(--navy, #15244A)",
            border: "1px solid rgba(212,175,55,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            color: "var(--cream, #F4ECD8)",
          }}
        >
          <div
            className="font-sans text-[10px] uppercase tracking-[0.18em] mb-2"
            style={{ color: "var(--gold-light, #E5C97A)" }}
          >
            Elevated Intelligence
          </div>
          <h1 className="font-serif text-[24px] font-semibold mb-3">Something broke while rendering.</h1>
          <p className="font-serif italic text-[14px] mb-5" style={{ color: "var(--slate-light, #A9B3C5)" }}>
            The portal hit a runtime error. The detail below has been logged to the browser console too.
          </p>
          <pre
            className="font-mono text-[12px] whitespace-pre-wrap break-words p-3 rounded-sm mb-4 max-h-[200px] overflow-auto"
            style={{ background: "rgba(0,0,0,0.35)", color: "var(--coral, #E07A5F)" }}
          >
            {this.state.error.message}
          </pre>
          {stack && (
            <details className="mb-4">
              <summary
                className="font-sans text-[11px] uppercase tracking-wider cursor-pointer"
                style={{ color: "var(--gold-light, #E5C97A)" }}
              >
                Component stack
              </summary>
              <pre
                className="font-mono text-[11px] whitespace-pre-wrap break-words p-3 rounded-sm mt-2 max-h-[260px] overflow-auto"
                style={{ background: "rgba(0,0,0,0.35)", color: "var(--slate-light, #A9B3C5)" }}
              >
                {stack.trim()}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-sm font-sans text-[12px] uppercase tracking-[0.18em]"
              style={{
                background: "var(--gold, #D4AF37)",
                color: "var(--navy-deep, #0F1A33)",
                border: "1px solid var(--gold, #D4AF37)",
              }}
            >
              Reload
            </button>
            <button
              onClick={() => {
                try {
                  window.localStorage.clear();
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              className="px-4 py-2 rounded-sm font-sans text-[12px] uppercase tracking-[0.18em]"
              style={{
                background: "transparent",
                color: "var(--cream, #F4ECD8)",
                border: "1px solid rgba(212,175,55,0.4)",
              }}
            >
              Reset local state & reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
