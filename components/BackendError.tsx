import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertCircle, X } from 'lucide-react';

export const BackendError: React.FC = () => {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        setIsChecking(true);
        const isHealthy = await api.checkBackendHealth();
        setIsBackendDown(!isHealthy);
      } catch (error) {
        setIsBackendDown(true);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately
    checkBackend();

    // Check every 10 seconds
    const interval = setInterval(checkBackend, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isChecking || !isBackendDown) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-bold">Backend Server Not Running</p>
            <p className="text-sm text-red-100">
              Please start the backend server with: <code className="bg-red-700 px-2 py-1 rounded">fastapi dev main.py</code>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsBackendDown(false)}
          className="text-white hover:text-red-200 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

