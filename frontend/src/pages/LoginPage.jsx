import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { AuthContext } from '../context/auth-context';

export default function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Login | StayBook AI</title>
      </Helmet>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="glass-panel p-8 md:p-10">
            <p className="eyebrow">Welcome back</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-950">Sign in to manage bookings, favorites, and AI concierge chats.</h1>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <p>Access your personalized dashboard, recent searches, booking activity, and payment statuses in one place.</p>
              <p>Use email/password or enable Google OAuth via environment configuration for a faster onboarding flow.</p>
            </div>
          </section>

          <section className="glass-panel p-8 md:p-10">
            <h2 className="text-2xl font-semibold text-slate-950">Login</h2>
            <p className="mt-2 text-sm text-slate-500">Continue with your account credentials.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && <ErrorBanner message={error} />}
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input mt-2"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input mt-2"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or continue with
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleLoginButton />

            <p className="mt-6 text-sm text-slate-500">
              New to StayBook AI?{' '}
              <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to="/register">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
