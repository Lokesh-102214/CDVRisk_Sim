/**
 * Layout — Shared shell with navigation for multi-page app.
 * Provides sticky header with Lucide icons and responsive nav.
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Heart,
  Activity,
  LayoutDashboard,
  UserRound,
  Info,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Predict', icon: Heart },
  { path: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans">
      {/* ─── Header ─── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
              <Heart className="text-teal-400" size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                CDVRisk<span className="text-teal-400">Sim</span>
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5 leading-tight">
                Cardiovascular Risk Visualization
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-teal-500/15 text-teal-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side info */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <Activity size={14} className="text-teal-500" />
            <span>3D Interactive • ML-Powered • SHAP Explained</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-800 px-4 py-2 space-y-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-500/15 text-teal-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* ─── Page Content ─── */}
      <main className="max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
