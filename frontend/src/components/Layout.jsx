import { Link, useLocation } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import AlertBanner from './AlertBanner';
import './Layout.css';

const NAV = [
  { to: '/',           icon: '🏠', label: 'Dashboard'  },
  { to: '/historical', icon: '📈', label: 'Historical'  },
  { to: '/scenario',   icon: '🔬', label: 'What-If'     },
];

export default function Layout({ children }) {
  const loc = useLocation();
  const { aqi } = useAlert();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="header-brand">
          <div className="brand-icon">🌬️</div>
          AQI Monitor
        </Link>
        <nav className="header-nav">
          {NAV.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${loc.pathname === to ? ' active' : ''}`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <AlertBanner aqi={aqi} />
      <main className="main">{children}</main>
    </div>
  );
}
