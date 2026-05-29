import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PartnerProfile from './pages/PartnerProfile';
import RatePartner from './pages/RatePartner';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user && !user.has_completed_onboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding route - protected but doesn't require onboarding completion */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected routes that require completed onboarding */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OnboardingCheck>
                <Dashboard />
              </OnboardingCheck>
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/:id"
          element={
            <ProtectedRoute>
              <OnboardingCheck>
                <PartnerProfile />
              </OnboardingCheck>
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/:id/rate"
          element={
            <ProtectedRoute>
              <OnboardingCheck>
                <RatePartner />
              </OnboardingCheck>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <OnboardingCheck>
                <Settings />
              </OnboardingCheck>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
