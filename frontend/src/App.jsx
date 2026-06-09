import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';

// Redirect to dashboard if logged in, otherwise show login/register page
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/dashboard" /> : children;
};

// Route handler for root "/" path
const RootRedirect = () => {
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;