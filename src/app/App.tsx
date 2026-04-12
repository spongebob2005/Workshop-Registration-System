import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { WorkshopProvider } from './contexts/WorkshopContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <AuthProvider>
      <WorkshopProvider>
        <RouterProvider router={router} />
        <Toaster />
        <SpeedInsights />
      </WorkshopProvider>
    </AuthProvider>
  );
}