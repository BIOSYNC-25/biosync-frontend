import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import SdkControlPage from './pages/SdkControlPage';
import CombinePage from './pages/CombinePage';
import RangeReportPage from './pages/RangeReportPage';

// Department Portal imports
import DepartmentDashboardLayout from './components/DepartmentDashboardLayout';
import DepartmentDashboardPage from './pages/DepartmentDashboardPage';
import DepartmentRangeReportPage from './pages/DepartmentRangeReportPage';

// User Dashboard imports
import UserDashboardLayout from './components/UserDashboardLayout';
import UserDashboardPage from './pages/UserDashboardPage';
import UserHistoricalPage from './pages/UserHistoricalPage';
import UserDownloadPage from './pages/UserDownloadPage';
import UserDailyPage from './pages/UserDailyPage';

import ParentDashboardPage from './pages/ParentDashboardPage';

const DashboardLayoutWrapper = () => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  if (location.pathname === '/') {
    if (!isAuthenticated) return <HomePage />;
    if (userRole === 'admin') return <DashboardLayout />;
    return <HomePage />;
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
};

const DepartmentDashboardLayoutWrapper = () => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated || userRole !== 'department') {
    return <Navigate to="/" replace />;
  }
  return <DepartmentDashboardLayout />;
};

const ParentRouteWrapper = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated || userRole !== 'parent') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Admin Dashboard Routes */}
          <Route path="/" element={<DashboardLayoutWrapper />}>
            <Route index element={<SdkControlPage />} />
            <Route path="combine" element={<CombinePage />} />
            <Route path="report" element={<RangeReportPage />} />
          </Route>

          {/* Protected Department Portal Routes */}
          <Route path="/department" element={<DepartmentDashboardLayoutWrapper />}>
            <Route index element={<DepartmentDashboardPage />} />
            <Route path="dashboard" element={<DepartmentDashboardPage />} />
            <Route path="range-report" element={<DepartmentRangeReportPage />} />
          </Route>

          {/* Protected Parent Portal Route */}
          <Route path="/parent/dashboard" element={
            <ParentRouteWrapper>
              <ParentDashboardPage />
            </ParentRouteWrapper>
          } />

          {/* Protected User Dashboard Routes */}
          <Route path="/user" element={<UserDashboardLayout />}>
            <Route index element={<UserDashboardPage />} />
            <Route path="daily" element={<UserDailyPage />} />
            <Route path="historical" element={<UserHistoricalPage />} />
            <Route path="download" element={<UserDownloadPage />} />
            {/* Redirect / Profile to Dashboard for now as placeholders */}
            <Route path="*" element={<UserDashboardPage />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
