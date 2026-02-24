import { Link, useLocation } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import AlertBanner from './AlertBanner';
import './Layout.css';

export default function Layout({ children }) {
  const loc = useLocation();
  const { aqi } = useAlert();
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">AQI Monitor</Link>
        <nav>
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <Link to="/historical" className={loc.pathname === '/historical' ? 'active' : ''}>Historical</Link>
          <Link to="/scenario" className={loc.pathname === '/scenario' ? 'active' : ''}>What-If</Link>
        </nav>
      </header>
      <AlertBanner aqi={aqi} />
      <main className="main">{children}</main>
    </div>
  );
}
