import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { isConvexConfigured } from "../convex/OptionalConvexProvider";

export const ADMIN_SESSION_KEY = "melvz-admin-session";

type AdminGateProps = {
  children: (session: {
    sessionToken: string;
    logout: () => void;
  }) => ReactElement;
  loginMessage?: string;
};

export function AdminGate({
  children,
  loginMessage = "Login to edit portfolio content.",
}: AdminGateProps): ReactElement {
  const createSession = useMutation(api.admin.createSession);
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sessionToken, setSessionToken] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) ?? ""
  );
  const validation = useQuery(
    api.admin.validateSession,
    sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (!validation || validation.ok) return;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSessionToken("");
    setStatus("Admin session expired");
  }, [validation]);

  if (!isConvexConfigured) return <AdminUnavailable />;

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const result = await createSession({ passcode });
      sessionStorage.setItem(ADMIN_SESSION_KEY, result.token);
      setSessionToken(result.token);
      setPasscode("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSessionToken("");
    setPasscode("");
    setStatus("");
  };

  if (!sessionToken || validation?.ok === false) {
    return (
      <main className="admin-root admin-root--center">
        <section className="admin-login-card">
          <div className="admin-brand">
            <span className="admin-brand__mark">M</span>
            <div>
              <h1>Portfolio Admin</h1>
              <p>{status || loginMessage}</p>
            </div>
          </div>
          <form className="admin-login" onSubmit={login}>
            <label className="admin-field">
              <span>Admin passcode</span>
              <input
                value={passcode}
                type="password"
                onChange={(event) => setPasscode(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter passcode"
              />
            </label>
            <button className="admin-primary-button" type="submit" disabled={busy || !passcode}>
              {busy ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (validation === undefined) {
    return (
      <main className="admin-root admin-root--center">
        <section className="admin-login-card">
          <div className="admin-history-empty">
            <Loader2 size={18} />
            Checking session...
          </div>
        </section>
      </main>
    );
  }

  return children({ sessionToken, logout });
}

function AdminUnavailable(): ReactElement {
  return (
    <main className="admin-root admin-root--center">
      <section className="admin-login-card">
        <div className="admin-brand">
          <span className="admin-brand__mark">M</span>
          <div>
            <h1>Portfolio Admin</h1>
            <p>Convex is not configured. Add `VITE_CONVEX_URL` and restart Vite.</p>
          </div>
        </div>
        <a href="/" className="admin-link">Return to portfolio</a>
      </section>
    </main>
  );
}
