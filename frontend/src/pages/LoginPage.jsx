import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { AuthContext } from "../context/auth-context";
import "../styles/login.css";

export default function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Login | StayBook AI</title>
      </Helmet>

      <div className="login-container">
        <div className="login-grid">
          {/* LEFT PANEL */}
          <section className="login-info">
            <p className="eyebrow">Welcome back</p>
            <h1 className="login-heading">
              Sign in to manage bookings, favorites, and AI concierge chats.
            </h1>
            <p className="login-desc">
              Access your dashboard, booking history, and personalized
              recommendations in one place.
            </p>
          </section>

          {/* RIGHT PANEL */}
          <section className="login-card">
            <h2 className="login-title">Login</h2>
            <p className="login-subtitle">
              Continue with your account credentials
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <ErrorBanner message={error} />}

              {/* EMAIL */}
              <div className="input-group">
                <input
                  type="email"
                  placeholder=" "
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
                <label>Email Address</label>
              </div>

              {/* PASSWORD */}
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <label>Password</label>

                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="divider">
              <span />
              OR
              <span />
            </div>

            <GoogleLoginButton />

            <p className="login-footer">
              New here?{" "}
              <Link to="/register">Create an account</Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}