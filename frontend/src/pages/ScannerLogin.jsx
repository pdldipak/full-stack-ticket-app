import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import EventBranding from '../components/EventBranding.jsx';
import {
  AuthAlternateLink,
  AuthFormCard,
  AuthRoleBadge,
  AuthShell,
  AuthTextField,
  FormErrorAlert,
  HeroSubtitle,
  PrimaryGradientButton,
} from '../components/common';
import { getApiErrorMessage } from '../utils/apiError.js';

export default function ScannerLogin() {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/scanner';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'scanner' ? '/scanner' : '/tickets'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.role === 'seller' || data.role === 'admin') {
        setError('Seller and admin accounts must use the main sign-in page.');
        return;
      }
      login(data.token, data.username, data.allowedCities || [], data.role || 'scanner');
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-5">
        <EventBranding forHero />
        <AuthRoleBadge variant="scanner">Door check-in</AuthRoleBadge>
        <HeroSubtitle>Sign in to scan QR codes and verify tickets at the entrance.</HeroSubtitle>
      </div>

      <AuthFormCard onSubmit={handleSubmit}>
        <FormErrorAlert message={error} variant="hero" />
        <AuthTextField
          id="scanner-username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          icon="user"
        />
        <AuthTextField
          id="scanner-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          icon="lock"
        />
        <PrimaryGradientButton disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in to scanner'}
        </PrimaryGradientButton>
      </AuthFormCard>

      <AuthAlternateLink to="/login">Seller sign-in</AuthAlternateLink>
    </AuthShell>
  );
}
