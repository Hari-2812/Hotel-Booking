import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/register.css";

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register({ name, email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Registration failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-container">
      <div className="w-full max-w-md">
        {/* Title */}
        <h1 className="register-title">Create Account ✨</h1>
        <p className="register-subtitle">Join us and get started</p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-6 space-y-5 register-card">
          {/* Error */}
          {error && <div className="register-error">{error}</div>}

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="register-input"
              placeholder="Your name"
            />
          </div>

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
              className="register-input"
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
              className="register-input"
              placeholder="Minimum 8 characters"
            />
          </div>

          {/* Button */}
          <button
            disabled={submitting}
            className="register-btn"
            type="submit"
          >
            {submitting ? "Creating..." : "Register"}
          </button>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link className="register-link" to="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}