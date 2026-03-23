import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Login failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-container">
      <div className="w-full max-w-md">
        {/* Title */}
        <h1 className="login-title">Welcome Back 👋</h1>
        <p className="login-subtitle">Login to your account</p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-6 space-y-5 login-card">
          {/* Error */}
          {error && <div className="login-error">{error}</div>}

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="login-input"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="login-input"
              placeholder="••••••••"
            />
          </div>

          {/* Button */}
          <button
            disabled={submitting}
            className="login-btn"
            type="submit"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link className="login-link" to="/register">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}