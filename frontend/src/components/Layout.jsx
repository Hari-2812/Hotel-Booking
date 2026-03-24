import { useContext, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { I18nContext } from '../context/i18n-context';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useContext(I18nContext);
  const navigation = useMemo(() => ([
    { to: '/', label: t('discover') },
    { to: '/wishlist', label: t('wishlist'), auth: true },
    { to: '/chat', label: t('concierge'), auth: true },
    { to: '/dashboard', label: t('dashboard'), auth: true },
    { to: '/admin', label: t('admin'), auth: true, role: 'admin' },
  ]), [t]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavigation = navigation.filter((item) => {
    if (item.auth && !user) return false;
    if (item.role && user?.role !== item.role) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_42%,_#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/50 bg-slate-950/85 text-white backdrop-blur-xl">
        <div className="app-container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#6366f1)] text-lg font-bold text-white shadow-glow">
              SB
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">StayBook</p>
              <p className="text-lg font-semibold text-white">Luxury booking platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 xl:flex">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <select className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">हिं</option>
              <option value="es">ES</option>
            </select>
            {user ? (
              <>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                  <span className="font-semibold text-white">{user.name}</span>
                  <span className="ml-2 text-slate-300">{user.role}</span>
                </div>
                <button className="btn-secondary" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost-light">Login</Link>
                <Link to="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white xl:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-slate-950/95 xl:hidden">
            <div className="app-container space-y-3 py-4">
              {visibleNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-200'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <button className="btn-secondary w-full" onClick={() => { setMobileOpen(false); logout(); }}>Logout</button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="btn-ghost-light text-center" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="app-container py-8 md:py-10">{children}</main>

      <footer className="mt-10 border-t border-white/60 bg-slate-950 text-slate-200">
        <div className="app-container grid gap-8 py-10 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">StayBook</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
              Professional hotel discovery with elegant design, AI-assisted recommendations, modern booking flows, and admin-grade operations.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Experience</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Natural language discovery</li>
              <li>• Real-time reservation flow</li>
              <li>• Premium responsive design</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Deployment</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>• Frontend-ready for Vercel</li>
              <li>• Backend-ready for Render</li>
              <li>• Environment-based configuration</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
