import { createBrowserRouter } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AdminNavbar } from './components/AdminNavbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { WorkshopDetails } from './pages/WorkshopDetails';
import { QuizPage } from './pages/QuizPage';
import { Payment } from './pages/Payment';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { BookingHistory } from './pages/BookingHistory';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminManagement } from './pages/admin/AdminManagement';
import { ManageRegistrations } from './pages/admin/ManageRegistrations';
import { ManageUsers } from './pages/admin/ManageUsers';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      {children}
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: '/workshop/:id',
    element: (
      <Layout>
        <WorkshopDetails />
      </Layout>
    ),
  },
  {
    path: '/workshop/:workshopId/quiz/:quizIndex',
    element: (
      <Layout>
        <QuizPage />
      </Layout>
    ),
  },
  {
    path: '/payment/:id',
    element: (
      <Layout>
        <ProtectedRoute>
          <Payment />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/payment-success/:bookingId',
    element: (
      <Layout>
        <ProtectedRoute>
          <PaymentSuccess />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/bookings',
    element: (
      <Layout>
        <ProtectedRoute>
          <BookingHistory />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminLayout>
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </AdminLayout>
    ),
  },
  {
    path: '/admin/workshops',
    element: (
      <AdminLayout>
        <AdminProtectedRoute>
          <AdminManagement />
        </AdminProtectedRoute>
      </AdminLayout>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminLayout>
        <AdminProtectedRoute>
          <ManageUsers />
        </AdminProtectedRoute>
      </AdminLayout>
    ),
  },
  {
    path: '/admin/registrations',
    element: (
      <AdminLayout>
        <AdminProtectedRoute>
          <ManageRegistrations />
        </AdminProtectedRoute>
      </AdminLayout>
    ),
  },
  {
    path: '*',
    element: (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Layout>
    ),
  },
]);