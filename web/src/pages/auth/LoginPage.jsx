import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import API_BASE_URL from "../../config/api";
import violessIcon from "../../assets/violessicon.png";
import "./../../styles/auth.css";

export default function LoginPage() {
  const { login, user, loading } = useAuth(); // include user & loading
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // For messages like reset email sent

  const identifierRef = useRef();

  // ─── Redirect if already logged in ──────────────────────────────
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  // ─── Auto-clear error/info messages after 5 seconds ─────────────
  useEffect(() => {
    if (error || info) {
      const timer = setTimeout(() => {
        setError("");
        setInfo("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, info]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!identifier.trim()) {
      setError("Please enter your username.");
      identifierRef.current?.focus();
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoadingForm(true);
    try {
      await login(identifier, password);
      navigate("/dashboard", { replace: true }); // ensure no back to login
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!identifier.trim()) {
      setError("Please enter your username to request a password reset.");
      identifierRef.current?.focus();
      return;
    }

    try {
      if (identifier.includes("@")) {
        throw new Error("Please enter your username only (not email)." );
      }

      const res = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request password reset");

      setInfo("Your request has been sent to the admin team.");
    } catch (err) {
      setError(err.message || "Failed to request password reset. Try again.");
    }
  };

  return (
    <div className="login-shell">
      {/* ── Left panel ── */}
      <aside className="login-left">
        <div className="ll-line-v" />
        <div className="ll-line-h" />
        <div className="ll-brand">
          <div className="ll-brand-mark">
            <img src={violessIcon} alt="Violess logo" />
          </div>
          <div>
            <div className="ll-brand-name">Vio-less</div>
            <div className="ll-brand-sub">Barangay Management System</div>
          </div>
        </div>
        <div className="ll-body">
          <h1 className="ll-headline">
            Protecting<br />
            communities,<br />
            <em>one case</em><br />
            at a time.
          </h1>
          <p className="ll-desc">
            Management system for violence reporting, case tracking, and community support coordination in barangay mabayuan.
          </p>
        </div>
        <footer className="ll-footer">
          Authorized personnel only &nbsp;&middot;&nbsp; All activity is logged and monitored
        </footer>
      </aside>

      {/* ── Right panel ── */}
      <main className="login-right">
        <div className="login-card">
          <div className="lc-eyebrow">Staff portal</div>
          <h2 className="lc-title">Sign in to<br />your account</h2>
          <p className="lc-sub">
            Enter your credentials to access the Barangay Management System.<br/>
            If you don't have access, contact your administrator.
          </p>

          {error && (
            <div className="lc-error">
              <div className="lc-error-dot" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="lc-info">
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Username</label>
              <input
                ref={identifierRef}
                id="identifier"
                className="form-input"
                type="text"
                placeholder="Enter your Username"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(""); setInfo(""); }}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="password">Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="pw-wrap">
                <input
                  id="password"
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); setInfo(""); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-eye"
                  onClick={() => setShowPw(s => !s)}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <i className={showPw ? "fas fa-eye-slash" : "fas fa-eye"} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              className="btn-submit"
              type="submit"
              disabled={loadingForm}
            >
              {loadingForm ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="lc-footer">
            <strong>Vio-less</strong> &nbsp;&middot;&nbsp; Barangay Mabayuan, Olongapo City<br />
            &copy; 2026 &nbsp;&middot;&nbsp; Authorized use only
          </div>
        </div>
      </main>
    </div>
  );
}