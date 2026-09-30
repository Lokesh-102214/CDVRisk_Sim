/**
 * API utility for communicating with the FastAPI backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
