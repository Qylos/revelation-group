import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SetupPasswordPage } from './pages/SetupPasswordPage';
import { GlobalDashboardPage } from './pages/GlobalDashboardPage';
import { BusinessDashboardPage } from './pages/BusinessDashboardPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { ProductsHppPage } from './pages/ProductsHppPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const HomeRedirect: React.FC = () => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'member') return <Navigate to="/transactions" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <GlobalDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:id/dashboard"
        element={
          <ProtectedRoute>
            <BusinessDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/businesses"
        element={
          <ProtectedRoute>
            <BusinessesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:id/products"
        element={
          <ProtectedRoute>
            <ProductsHppPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <SuperAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/404"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
