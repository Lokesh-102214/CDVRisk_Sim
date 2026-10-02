/**
 * App.jsx — Root router for the multi-page CDVRisk_Sim application.
 */
import { useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import PredictPage from './pages/PredictPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      {/* 
        We use display:none to hide the PredictPage instead of unmounting it.
        This preserves the heavy WebGL context (Canvas) and all the filled-out form state!
      */}
      <div style={{ display: location.pathname === '/' ? 'block' : 'none' }}>
        <PredictPage />
      </div>
      
      {location.pathname === '/about' && (
        <AboutPage />
      )}
    </Layout>
  );
}
