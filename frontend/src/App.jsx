/**
 * App.jsx — Root router for the multi-page CDVRisk_Sim application.
 */
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PredictPage from './pages/PredictPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PredictPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
