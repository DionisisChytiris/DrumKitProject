import React, { useEffect, useMemo, useState } from 'react';
import './AuthModal.css';

export type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const DEMO_EMAIL = 'demo@drumkit.local';
const DEMO_PASSWORD = 'DrumKit123';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === 'login' ? 'Log in' : 'Sign up'), [mode]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset modal state when opening
    setEmail('');
    setPassword('');
    setError(null);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const validate = () => {
    const ok = email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD;
    if (!ok) {
      setError(`For now, use the demo credentials.`);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    // Client-only "auth"
    localStorage.setItem('drumkitAuth.loggedIn', 'true');
    localStorage.setItem('drumkitAuth.email', DEMO_EMAIL);
    window.dispatchEvent(new Event('drumkit-auth-change'));
    onSuccess(DEMO_EMAIL);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{title}</h2>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="auth-modal-body" onSubmit={handleSubmit}>
          <div className="auth-modal-hint">
            Demo login (no backend): <span className="auth-demo-email">{DEMO_EMAIL}</span> /{' '}
            <span className="auth-demo-password">{DEMO_PASSWORD}</span>
          </div>

          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-modal-footer">
            <button className="auth-submit" type="submit">
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

