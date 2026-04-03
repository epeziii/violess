import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import app from "../../firebase";
import "./../../styles/auth.css";

export default function LoginPage() {
  const { login, user, loading } = useAuth(); // include user & loading
  const navigate = useNavigate();
  const auth = getAuth(app);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // For messages like reset email sent

  const emailRef = useRef();

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

    if (!email.trim()) {
      setError("Please enter your email address.");
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoadingForm(true);
    try {
      await login(email, password);
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

    if (!email.trim()) {
      setError("Please enter your email to reset your password.");
      emailRef.current?.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email. Try again.");
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
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M7 12h10" />
            </svg>
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
            The official management system for violence reporting,
            case tracking, and community support coordination
            in barangay mabayuan.
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
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                ref={emailRef}
                id="email"
                className="form-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); setInfo(""); }}
                autoComplete="email"
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
                  {showPw ? "🙈" : "👁"}
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