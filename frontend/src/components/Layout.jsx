import { Link, NavLink } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900">
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="app-container flex items-center justify-between py-3">
          <Link to="/" className="text-lg font-semibold text-indigo-700">
            StayBook
          </Link>

          <nav className="hidden items-center gap-4 text-sm md:flex">
            <NavLink to="/" className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}>
              Home
            </NavLink>

            {user ? (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}>
                  Dashboard
                </NavLink>
                {user.role === "admin" && (
                  <NavLink to="/admin" className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}>
                    Admin
                  </NavLink>
                )}
                <button
                  onClick={logout}
                  className="rounded-md bg-indigo-700 px-3 py-1.5 text-white hover:bg-indigo-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}>
                  Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}>
                  Register
                </NavLink>
              </>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden">
            <div className="app-container pb-4">
              <nav className="flex flex-col gap-2 text-sm">
                <NavLink
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}
                >
                  Home
                </NavLink>

                {user ? (
                  <>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}
                    >
                      Dashboard
                    </NavLink>
                    {user.role === "admin" && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}
                      >
                        Admin
                      </NavLink>
                    )}
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="rounded-md bg-indigo-700 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-indigo-800"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => (isActive ? "font-semibold text-indigo-700" : "text-gray-700")}
                    >
                      Register
                    </NavLink>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="app-container py-6">{children}</main>

      <footer className="border-t py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} StayBook. All rights reserved.
      </footer>
    </div>
  );
}

