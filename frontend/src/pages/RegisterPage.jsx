import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { AuthContext } from "../context/auth-context";
import "../styles/register.css";

export default function RegisterPage() {
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Register | StayBook AI</title>
      </Helmet>

      <div className="register-container">
        <div className="register-grid">
          {/* LEFT PANEL */}
          <section className="register-info">
            <p className="eyebrow">Build your travel profile</p>
            <h1 className="register-heading">
              Create a modern booking account with personalized recommendations.
            </h1>
            <ul className="register-desc">
              <li>• Save favorite stays</li>
              <li>• AI-powered recommendations</li>
              <li>• Track bookings & payments</li>
            </ul>
          </section>

          {/* RIGHT PANEL */}
          <section className="register-card">
            <h2 className="register-title">Create account</h2>
            <p className="register-subtitle">
              Start with your details below
            </p>

            <form onSubmit={handleSubmit} className="register-form">
              {error && <ErrorBanner message={error} />}

              {/* NAME */}
              <div className="input-group">
                <input
                  type="text"
                  placeholder=" "
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
                <label>Full Name</label>
              </div>

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
                  minLength={8}
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
                className="register-btn"
                disabled={submitting}
              >
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="divider">
              <span />
              OR
              <span />
            </div>

            <GoogleLoginButton />

            <p className="register-footer">
              Already registered? <Link to="/login">Log in</Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}