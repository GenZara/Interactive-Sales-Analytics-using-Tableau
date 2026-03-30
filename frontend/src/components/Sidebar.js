import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  MdDashboard, MdBarChart, MdPeople, MdFilterList,
  MdLightMode, MdDarkMode, MdDownload,
} from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/',          icon: MdDashboard, label: 'Overview' },
  { to: '/analytics', icon: MdBarChart,  label: 'Sales Analytics' },
  { to: '/customers', icon: MdPeople,    label: 'Customers' },
];

export default function Sidebar({ onExport }) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="14" width="4" height="6" rx="1" fill="white" fillOpacity="0.4" />
            <rect x="10" y="8" width="4" height="12" rx="1" fill="white" fillOpacity="0.7" />
            <rect x="17" y="3" width="4" height="17" rx="1" fill="white" />
            <path d="M3 13L10 7L17 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-text">SalesIQ <span style={{ color: 'var(--accent-1)', fontSize: '10px' }}>PRO</span></div>
          <div className="sidebar-logo-sub">Analytics Dashboard</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Dashboard</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className="sidebar-footer">
        <button className="nav-link" onClick={toggle} style={{ border: '1px solid var(--border)', background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 8 }}>
          {theme === 'dark'
            ? <><MdLightMode className="nav-icon" /> Light Mode</>
            : <><MdDarkMode  className="nav-icon" /> Dark Mode</>
          }
        </button>
        
        <div className="export-select" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
           <div className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 12, marginBottom: 4 }}>EXPORT DATA</div>
           <button className="nav-link" onClick={() => onExport('pdf')} style={{ padding: '8px 12px' }}>
             <MdDownload className="nav-icon" /> PDF Report
           </button>
           <button className="nav-link" onClick={() => onExport('csv')} style={{ padding: '8px 12px' }}>
             <MdDownload className="nav-icon" /> CSV Dataset
           </button>
        </div>
      </div>
    </aside>
  );
}
