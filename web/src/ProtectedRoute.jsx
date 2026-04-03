import { useAuth } from "./AuthContext";
import { Navigate } from "react-router-dom";

// Wraps any page that requires authentication
export function ProtectedRoute({ children, permission }) {
  const { user, loading, can } = useAuth();

  // ⚡ Show a loading spinner while Firebase checks the auth state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        Loading...
      </div>
    );
  }

  // ⚡ If not logged in after loading is complete, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⚡ Permission check if a specific permission is required
  if (permission && !can(permission)) {
    return (
      <div className="access-denied">
        <div className="ad-icon">🔒</div>
        <h2 className="ad-title">Access Restricted</h2>
        <p className="ad-text">
          Your role ({user.role}) does not have permission to view this page.
          Please contact your Barangay Admin.
        </p>
      </div>
    );
  }

  // ⚡ User is logged in and has permission (if required)
  return children;
}