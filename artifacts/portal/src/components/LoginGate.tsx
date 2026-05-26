import { useEffect, useState, type ReactNode, type FormEvent } from "react";

type AuthState = "loading" | "anon" | "authed";

/**
 * Phase 1 session-cookie gate. Wraps the whole app. While the status check
 * is in flight we render nothing (blank screen) to prevent a flash of
 * authenticated content before we know the truth. Once we know, we either
 * render the children or render the login card.
 */
export default function LoginGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/status", { credentials: "include" });
        const data: { authenticated?: boolean } = await r.json();
        if (cancelled) return;
        setState(data.authenticated ? "authed" : "anon");
      } catch {
        if (cancelled) return;
        setState("anon");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (r.ok) {
        // Re-check status to confirm the cookie took.
        const s = await fetch("/api/auth/status", { credentials: "include" });
        const data: { authenticated?: boolean } = await s.json();
        setState(data.authenticated ? "authed" : "anon");
        if (!data.authenticated) setError("Sign-in failed, please try again");
      } else {
        setError("Wrong username or password");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "loading") return null;
  if (state === "authed") return <>{children}</>;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--navy-deep, #0F1A33)" }}
    >
      <form
        onSubmit={onSubmit}
        className="w-[360px] p-8 rounded-sm"
        style={{
          background: "var(--navy, #15244A)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="font-serif text-[28px] font-semibold"
          style={{ color: "var(--cream, #F4ECD8)" }}
        >
          Elevated Intelligence
        </div>
        <div
          className="font-serif italic text-[14px] mt-1 mb-6"
          style={{ color: "var(--slate-light, #A9B3C5)" }}
        >
          Different Day internal access
        </div>

        <label className="block">
          <span
            className="font-sans text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--gold-light, #E5C97A)" }}
          >
            Username
          </span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
            className="mt-1 w-full px-3 py-2 rounded-sm font-sans text-[14px] outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--cream, #F4ECD8)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </label>

        <label className="block mt-4">
          <span
            className="font-sans text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--gold-light, #E5C97A)" }}
          >
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="mt-1 w-full px-3 py-2 rounded-sm font-sans text-[14px] outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--cream, #F4ECD8)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="mt-6 w-full py-2 rounded-sm font-sans text-[13px] uppercase tracking-[0.18em] disabled:opacity-50"
          style={{
            background: "var(--gold, #D4AF37)",
            color: "var(--navy-deep, #0F1A33)",
            border: "1px solid var(--gold, #D4AF37)",
          }}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        {error && (
          <div
            className="mt-4 font-sans text-[12px]"
            style={{ color: "var(--coral, #E07A5F)" }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

/**
 * Triggers logout, clears the session cookie, then reloads so the LoginGate
 * re-runs its status check on a clean slate. Used by the header "Sign out".
 */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Even if the request fails the cookie is invalidated server-side on
    // process restart anyway. Reload regardless so the UI doesn't lie.
  }
  window.location.reload();
}
