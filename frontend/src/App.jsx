import { Routes, Route } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Historical from './pages/Historical';
import Scenario from './pages/Scenario';

export default function App() {
  return (
    <AlertProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/historical" element={<Historical />} />
        <Route path="/scenario" element={<Scenario />} />
      </Routes>
    </Layout>
    </AlertProvider>
  );
}
