import React, { useState, useEffect } from 'react';
import { X, Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { authService, type UserAccount } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authView, setAuthView] = useState<'main' | 'google' | 'github'>('main');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Custom OAuth inputs
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  const [customGithubName, setCustomGithubName] = useState('');
  const [customGithubEmail, setCustomGithubEmail] = useState('');
  const [showCustomGithub, setShowCustomGithub] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setAuthView('main');
    setShowCustomGoogle(false);
    setShowCustomGithub(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const accounts = authService.getAccounts();
  const googleAccounts = accounts.filter((a) => a.provider === 'google');
  const githubAccounts = accounts.filter((a) => a.provider === 'github');

  const handleSelectAccount = (acc: UserAccount) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      authService.setCurrentUser(acc);
      onLoginSuccess(acc);
      onClose();
    }, 300);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const displayName =
        name.trim() ||
        accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())?.name ||
        email.split('@')[0];

      const userAccount: UserAccount = {
        id: `email-${Date.now()}`,
        name: displayName,
        email: email.trim().toLowerCase(),
        provider: 'email',
      };

      authService.setCurrentUser(userAccount);
      onLoginSuccess(userAccount);
      onClose();
    }, 400);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const gUser: UserAccount = {
        id: `google-${Date.now()}`,
        name: customGoogleName.trim() || customGoogleEmail.split('@')[0],
        email: customGoogleEmail.trim().toLowerCase(),
        provider: 'google',
      };
      authService.setCurrentUser(gUser);
      onLoginSuccess(gUser);
      onClose();
    }, 350);
  };

  const handleCustomGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGithubName.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const ghUser: UserAccount = {
        id: `github-${Date.now()}`,
        name: customGithubName.trim(),
        email: customGithubEmail.trim().toLowerCase() || `${customGithubName.trim().toLowerCase()}@github.com`,
        provider: 'github',
      };
      authService.setCurrentUser(ghUser);
      onLoginSuccess(ghUser);
      onClose();
    }, 350);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '30px',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(15, 17, 24, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(139, 92, 246, 0.15)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* ─── VIEW 1: GOOGLE ACCOUNT CHOOSER ─── */}
        {authView === 'google' ? (
          <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <button
                onClick={() => setAuthView('main')}
                className="btn btn-ghost btn-xs"
                style={{ gap: '6px', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  marginBottom: '10px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12s.6 3.7 1.6 5.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
                Choose a Google Account
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Select an account to continue to BolDB
              </p>
            </div>

            {/* List of existing Google accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {googleAccounts.map((acc) => (
                <button
                  key={acc.id || acc.email}
                  disabled={isLoading}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(66, 133, 244, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {acc.name[0]?.toUpperCase() || 'G'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#4285F4', fontWeight: 600 }}>Sign in</span>
                </button>
              ))}
            </div>

            {/* Custom Google Account Section */}
            {!showCustomGoogle ? (
              <button
                onClick={() => setShowCustomGoogle(true)}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px', fontSize: '0.78rem', gap: '8px', color: 'var(--accent-light)' }}
              >
                <Plus size={14} />
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="animate-slide-up" style={{ marginTop: '12px', background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                  Enter your Google Account:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Ishmeet Singh)"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Google Email (e.g. yourname@gmail.com)"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}
                  >
                    {isLoading ? 'Connecting...' : 'Continue with this Google Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : authView === 'github' ? (
          /* ─── VIEW 2: GITHUB ACCOUNT AUTHORIZER ─── */
          <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <button
                onClick={() => setAuthView('main')}
                className="btn btn-ghost btn-xs"
                style={{ gap: '6px', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#24292e',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  marginBottom: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
                Sign in with GitHub
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Select or specify your GitHub account
              </p>
            </div>

            {/* List of existing GitHub accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {githubAccounts.map((acc) => (
                <button
                  key={acc.id || acc.email}
                  disabled={isLoading}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#333',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {acc.name[0]?.toUpperCase() || 'H'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-light)', fontWeight: 600 }}>Authorize</span>
                </button>
              ))}
            </div>

            {/* Custom GitHub Account Section */}
            {!showCustomGithub ? (
              <button
                onClick={() => setShowCustomGithub(true)}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px', fontSize: '0.78rem', gap: '8px', color: 'var(--accent-light)' }}
              >
                <Plus size={14} />
                <span>Use another GitHub handle</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGithubSubmit} className="animate-slide-up" style={{ marginTop: '12px', background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                  Enter your GitHub Details:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="GitHub Username (e.g. DhavalGupta1)"
                    value={customGithubName}
                    onChange={(e) => setCustomGithubName(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                    required
                  />
                  <input
                    type="email"
                    placeholder="GitHub Email (optional)"
                    value={customGithubEmail}
                    onChange={(e) => setCustomGithubEmail(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}
                  >
                    {isLoading ? 'Authorizing...' : 'Authorize as GitHub User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ─── VIEW 3: MAIN AUTH MODAL (SIGN IN / SIGN UP) ─── */
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={15} color="#fff" />
                </div>
                <span className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  BolDB Account
                </span>
              </div>

              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'var(--bg-elevated)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => setMode('signin')}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'signin' ? 'var(--accent)' : 'transparent',
                  color: mode === 'signin' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'signup' ? 'var(--accent)' : 'transparent',
                  color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setAuthView('google')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  gap: '10px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12s.6 3.7 1.6 5.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => setAuthView('github')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  gap: '10px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                or with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ishmeet Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      style={{ paddingLeft: '34px' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  {mode === 'signin' && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent-light)', cursor: 'pointer' }}>
                      Forgot password?
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '34px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  marginTop: '6px',
                  gap: '6px',
                }}
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to BolDB' : 'Create Free Account'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Footer info */}
            <p style={{ fontSize: '0.67rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
              Zero credentials stored on remote servers. Sessions securely managed in browser storage.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
