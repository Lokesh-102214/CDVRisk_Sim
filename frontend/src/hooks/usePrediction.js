/**
 * Custom hook for managing prediction state and API calls.
 */
import { useState, useCallback } from 'react';
import { fetchPrediction, fetchSamplePatients } from '../utils/api';

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPrediction(patientData);
      setResult(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Prediction failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, predict, reset };
}

export function useSamplePatients() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSamples = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSamplePatients();
      setSamples(data);
      return data;
    } catch (err) {
      console.error('Failed to load samples:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { samples, loading, loadSamples };
}
