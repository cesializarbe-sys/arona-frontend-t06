import React, { type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/context/AuthContext';
import { MainLayout } from './shared/components/MainLayout';
import { AccessDeniedView } from './shared/components/AccessDeniedView';

import { LoginPage } from './features/auth/pages/LoginPage';
import { LoginAdminPage } from './features/auth/pages/LoginAdminPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { ProfilePage } from './features/auth/pages/ProfilePage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { FieldsPage } from './features/fields/pages/FieldsPage';
import { ProductionPage } from './features/harvests/pages/ProductionPage';
import { CropsPage } from './features/crops/pages/CropsPage';
import { ActivitiesPage } from './features/activities/pages/ActivitiesPage';
import { AlertsPage } from './features/alerts/pages/AlertsPage';
import { QualityPage } from './features/quality/pages/QualityPage';
import { DispatchPage } from './features/dispatches/pages/DispatchPage';
import { AdminPanelPage } from './features/users/pages/AdminPanelPage';
import { AnalyticsDashboardPage } from './features/analytics/pages/AnalyticsDashboardPage';
import { IndicatorsPage } from './features/analytics/pages/IndicatorsPage';

interface RouteGuardProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: RouteGuardProps) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login-admin" replace />;
  }
  if (!isAdmin) {
    return <AccessDeniedView />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: RouteGuardProps) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AuthenticatedLayout() {
  const { userName, userRole, userInitials, isAdmin, logout } = useAuth();
  return (
    <MainLayout
      userName={userName}
      userRole={userRole}
      userInitials={userInitials}
      isAdmin={isAdmin}
      onLogout={logout}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      <Route
        path="/auth/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/login-admin"
        element={
          <PublicRoute>
            <LoginAdminPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/produccion" element={<ProductionPage />} />
        <Route path="/mis-campos" element={<FieldsPage />} />
        <Route path="/mis-datos" element={<ProfilePage />} />
        <Route path="/cultivos" element={<CropsPage />} />
        <Route path="/actividades" element={<ActivitiesPage />} />
        <Route path="/enfermedades" element={<AlertsPage />} />
        <Route path="/calidad" element={<QualityPage />} />
        <Route path="/despachos" element={<DispatchPage />} />
        <Route
          path="/panel-admin"
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />
        <Route
          path="/analitica"
          element={
            <AdminRoute>
              <AnalyticsDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/analitica/indicadores"
          element={
            <AdminRoute>
              <IndicatorsPage />
            </AdminRoute>
          }
        />

        <Route path="/configuracion" element={<Navigate to="/dashboard" replace />} />
        <Route path="/clientes-export" element={<Navigate to="/cultivos" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
