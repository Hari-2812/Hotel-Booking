import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { AuthContext } from '../context/auth-context';

export default function RegisterPage() {
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [navigate, user]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Register | StayBook AI</title>
      </Helmet>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1fr]">
          <section className="glass-panel p-8 md:p-10">
            <p className="eyebrow">Build your travel profile</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-950">Create a modern booking account with personalized recommendations built in.</h1>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li>• Save favorite stays and compare destinations.</li>
              <li>• Receive AI-powered recommendations based on your preferences.</li>
              <li>• Track bookings, payments, recent searches, and support chats.</li>
            </ul>
          </section>

          <section className="glass-panel p-8 md:p-10">
            <h2 className="text-2xl font-semibold text-slate-950">Create account</h2>
            <p className="mt-2 text-sm text-slate-500">Start with your details below.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && <ErrorBanner message={error} />}
              <div>
                <label className="label">Full name</label>
                <input
                  className="input mt-2"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Jane Doe"
                  required
                />
              </div>
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
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or continue with
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleLoginButton />

            <p className="mt-6 text-sm text-slate-500">
              Already registered?{' '}
              <Link className="font-semibold text-indigo-600 hover:text-indigo-500" to="/login">
                Log in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
