import { RouterProvider } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes/AppRoutes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache by default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isInitializing } = useAuth();
  const [showSlowConnection, setShowSlowConnection] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (isInitializing) {
      timeout = setTimeout(() => setShowSlowConnection(true), 8000);
    }
    return () => clearTimeout(timeout);
  }, [isInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-indigo-500 mb-8 tracking-widest animate-pulse">
          COURSE EDU
        </h1>
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 mb-2">Initializing Management System...</p>
        {showSlowConnection && (
          <p className="text-amber-500 animate-in fade-in duration-500">
            Connection is slower than expected. Please check your network.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
