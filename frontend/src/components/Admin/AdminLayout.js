import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, BarChart3,
  LogOut, Menu, X, Shield, ChevronRight, Activity
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { path: '/hr/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['HR', 'ADMIN'] },
  { path: '/hr/monitoring', label: 'Live Monitoring', icon: Activity, roles: ['HR', 'ADMIN'] },
  { path: '/hr/analytics', label: 'Analytics', icon: BarChart3, roles: ['HR', 'ADMIN'] },
  { path: '/hr/ranking', label: 'Ranking', icon: Users, roles: ['HR', 'ADMIN'] },
];

export default function AdminLayout({ children, title, breadcrumbs = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white transition-all duration-300 flex flex-col border-r border-border-light z-20`}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-border-light">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield size={18} className="text-white flex-shrink-0" />
          </div>
          {sidebarOpen && <span className="text-slate-900 font-extrabold text-sm tracking-tight uppercase">AI Proctor</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          {navItems.filter(item => item.roles.includes(user?.role)).map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`menu-item ${active ? 'active' : ''}`}>
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border-light">
          {sidebarOpen && (
            <div className="mb-4 px-3 py-2 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Administrator' : 'HR Manager'}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium">
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-border-light px-8 py-4 flex items-center gap-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 p-1.5 rounded-lg border border-transparent hover:border-border-light">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-blue-600 transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-blue-600 font-bold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {title && <h1 className="text-2xl font-bold text-blue-950 mb-6">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
