import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from '@src/api/client.js';
import { useAuth } from '@src/context/AuthContext.jsx';
import EventBranding from '@src/components/EventBranding.jsx';
import {
  AuthAlternateLink,
  AuthFormCard,
  AuthRoleBadge,
  AuthShell,
  AuthTextField,
  FormErrorAlert,
  HeroSubtitle,
  PrimaryGradientButton,
} from '@src/components/common';
import { LOGIN_ORDER_LINK_TEXT } from '@src/config/eventConfig.js';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import styles from '@src/pages/Login.module.css';

export default function Login() {
  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/tickets';

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
      if (data.role === 'scanner') {
        setError('Door-staff accounts must use the Scanner sign-in page.');
        return;
      }
      login(
        data.token,
        data.username,
        data.allowedCities || [],
        data.role || 'seller',
        data.sellerUsernames
      );
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className={styles.login__heroStack}>
        <EventBranding forHero />
        <AuthAlternateLink to="/order" variant="red">
          {LOGIN_ORDER_LINK_TEXT}
        </AuthAlternateLink>
        <AuthRoleBadge variant="seller">Seller portal</AuthRoleBadge>
        <HeroSubtitle>Create and manage tickets for your assigned cities.</HeroSubtitle>
      </div>

      <AuthFormCard onSubmit={handleSubmit}>
        <FormErrorAlert message={error} variant="hero" />
        <AuthTextField
          id="username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          icon="user"
        />
        <AuthTextField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          icon="lock"
        />
        <PrimaryGradientButton disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </PrimaryGradientButton>
      </AuthFormCard>

      <AuthAlternateLink to="/scanner-login" variant="red">
        Door staff scanner sign-in
      </AuthAlternateLink>
    </AuthShell>
  );
}
