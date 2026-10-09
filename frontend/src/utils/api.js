/**
 * API utility for communicating with the FastAPI backend.
 */
import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_URL || '';

// Clean up the URL provided by the user in Vercel environment variables:
// 1. Remove trailing slash if present
if (apiBaseUrl.endsWith('/')) {
  apiBaseUrl = apiBaseUrl.slice(0, -1);
}
// 2. Remove /api if they already included it, to avoid /api/api
if (apiBaseUrl.endsWith('/api')) {
  apiBaseUrl = apiBaseUrl.slice(0, -4);
}

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export async function fetchPrediction(patientData) {
  const response = await api.post('/predict', patientData);
  return response.data;
}

export async function fetchSamplePatients() {
  const response = await api.get('/sample-patients');
  return response.data;
}

export async function fetchModelMetrics() {
  const response = await api.get('/model-metrics');
  return response.data;
}

export default api;
