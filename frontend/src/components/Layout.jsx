import { useContext, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';

const navigation = [
  { to: '/', label: 'Discover' },
  { to: '/wishlist', label: 'Wishlist', auth: true },
  { to: '/chat', label: 'AI Concierge', auth: true },
  { to: '/dashboard', label: 'Dashboard', auth: true },
  { to: '/admin', label: 'Admin', auth: true, role: 'admin' },
];

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navigation.filter((item) => {
    if (item.auth && !user) return false;
    if (item.role && user?.role !== item.role) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.15),_transparent_30%),linear-gradient(180deg,_#f8fafc,_#eef2ff_45%,_#f8fafc)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="app-container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-glow">
              S
            </span>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">StayBook AI</div>
              <div className="text-lg font-semibold text-slate-900">Premium hotel intelligence</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <div className="rounded-full bg-white px-4 py-2 text-sm shadow-soft">
                  <span className="font-semibold text-slate-900">{user.name}</span>
                  <span className="ml-2 text-slate-500">{user.role}</span>
                </div>
                <button className="btn-primary" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white text-slate-700 shadow-soft lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/70 bg-white/90 lg:hidden">
            <div className="app-container space-y-3 py-4">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-medium ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {user ? (
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="btn-secondary text-center" onClick={() => setMobileOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="app-container py-8 md:py-10">{children}</main>

      <footer className="border-t border-white/60 bg-white/60 py-10 backdrop-blur">
        <div className="app-container grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-500">StayBook AI</p>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Modern hotel booking with smart recommendations, real-time availability, secure payments, and an AI-powered guest experience.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Platform features</p>
            <ul className="mt-3 space-y-2">
              <li>• Smart natural-language search</li>
              <li>• Dynamic pricing insights</li>
              <li>• Personalized dashboard and wishlist</li>
            </ul>
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Deployment ready</p>
            <ul className="mt-3 space-y-2">
              <li>• Frontend optimized for Vercel</li>
              <li>• Backend optimized for Render</li>
              <li>• Environment-driven API and auth</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
