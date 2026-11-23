import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AdminRegisterPage from './pages/auth/AdminRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Student Pages
import HomePage from './pages/student/HomePage';
import MenuPage from './pages/student/MenuPage';
import CartPage from './pages/student/CartPage';
import OrdersPage from './pages/student/OrdersPage';
import OrderDetailPage from './pages/student/OrderDetailPage';
import ProfilePage from './pages/student/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminFoodItemsPage from './pages/admin/AdminFoodItemsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Super Admin Page
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import SuperAdminRoute from './routes/SuperAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  fontSize: '13px',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
              }}
            />
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/register" element={<AdminRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

              {/* Student Portal (Protected) */}
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Canteen Admin Portal (Protected Role: canteen_admin / super_admin) */}
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
              <Route path="/admin/food" element={<AdminRoute><AdminFoodItemsPage /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />

              {/* Super Admin Portal (Protected Role: super_admin) */}
              <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
