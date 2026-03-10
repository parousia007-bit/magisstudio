import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import GearVaultPage from './pages/GearVaultPage';
import GearDetailPage from './pages/GearDetailPage';
import LaboratorioSonoro from './pages/LaboratorioSonoro';
import BovedaDescargasPage from './pages/BovedaDescargasPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AuthProvider } from './context/AuthContext';

import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioPlayerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="gear" element={<GearVaultPage />} />
                <Route path="gear/:slug" element={<GearDetailPage />} />
                <Route path="laboratorio" element={<LaboratorioSonoro />} />
                <Route path="descargas" element={<BovedaDescargasPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="registro" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-console)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(20px)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--color-amber)', secondary: 'var(--color-void)' } },
              error:   { iconTheme: { primary: 'var(--color-crimson)', secondary: 'var(--color-void)' } },
            }}
          />
        </AudioPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
