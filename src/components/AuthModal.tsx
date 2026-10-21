import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, Plus,
  Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { authService, type UserAccount } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

type AuthView = 'main' | 'google' | 'github' | 'verify-email';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authView, setAuthView] = useState<AuthView>('main');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  // Email Verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Custom OAuth inputs
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  const [customGithubName, setCustomGithubName] = useState('');
  const [customGithubEmail, setCustomGithubEmail] = useState('');
  const [showCustomGithub, setShowCustomGithub] = useState(false);

  // Reset states on opening or mode switch
  useEffect(() => {
    setMode(initialMode);
    setAuthView('main');
    setShowCustomGoogle(false);
    setShowCustomGithub(false);
    setErrorMessage('');
    setSuccessNotice('');
    setVerificationCode('');
  }, [initialMode, isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const accounts = authService.getAccounts();
  const googleAccounts = accounts.filter((a) => a.provider === 'google');
  const githubAccounts = accounts.filter((a) => a.provider === 'github');

  const handleSelectAccount = (acc: UserAccount) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      authService.setCurrentUser(acc);
      onLoginSuccess(acc);
      onClose();
    }, 300);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'signup') {
      // 1. Validate Name
      if (!name.trim() || name.trim().length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }

      // 2. Validate Email format
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setErrorMessage('Please enter a valid email address (e.g. name@company.com).');
        return;
      }

      // 3. Strict Duplicate Prevention
      if (authService.isEmailRegistered(cleanEmail)) {
        setErrorMessage('An account with this email address already exists. Please sign in instead.');
        return;
      }

      // 4. Validate Password length
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      // 5. Validate Password Match
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please ensure both passwords match.');
        return;
      }

      // 6. Terms check
      if (!agreeTerms) {
        setErrorMessage('Please agree to the Terms of Service to create your account.');
        return;
      }

      setIsLoading(true);
      try {
        const { code } = await authService.requestEmailVerification(name, cleanEmail, password);
        setSimulatedCode(code);
        setVerificationCode('');
        setResendCooldown(30);
        setAuthView('verify-email');
        setIsLoading(false);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Failed to start registration.');
      }
    } else {
      // Sign In Flow
      if (!cleanEmail) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const userAccount = await authService.loginUser(cleanEmail, password);
        setIsLoading(false);
        onLoginSuccess(userAccount);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit confirmation code.');
      return;
    }

    setIsLoading(true);
    try {
      const userAccount = await authService.confirmEmailVerification(email, verificationCode);
      setIsLoading(false);
      onLoginSuccess(userAccount);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Invalid or expired verification code.');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const newCode = await authService.resendVerificationCode(email);
      setSimulatedCode(newCode);
      setResendCooldown(30);
      setSuccessNotice('A new verification code has been generated and sent!');
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to resend code.');
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customGoogleEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Reuse existing account if already registered
      const existing = authService.findAccountByEmail(cleanEmail);
      if (existing) {
        authService.setCurrentUser(existing);
        onLoginSuccess(existing);
        onClose();
        return;
      }

      const gUser: UserAccount = {
        id: `google-${Date.now()}`,
        name: customGoogleName.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        provider: 'google',
        isVerified: true,
        createdAt: Date.now(),
      };
      authService.setCurrentUser(gUser);
      onLoginSuccess(gUser);
      onClose();
    }, 350);
  };

  const handleCustomGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customGithubEmail.trim().toLowerCase() || `${customGithubName.trim().toLowerCase()}@github.com`;
    if (!customGithubName.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Reuse existing account if already registered
      const existing = authService.findAccountByEmail(cleanEmail);
      if (existing) {
        authService.setCurrentUser(existing);
        onLoginSuccess(existing);
        onClose();
        return;
      }

      const ghUser: UserAccount = {
        id: `github-${Date.now()}`,
        name: customGithubName.trim(),
        email: cleanEmail,
        provider: 'github',
        isVerified: true,
        createdAt: Date.now(),
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
          maxWidth: '470px',
          width: '100%',
          padding: '28px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* ─── VIEW 1: EMAIL VERIFICATION CODE SCREEN ─── */}
        {authView === 'verify-email' ? (
          <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => { setAuthView('main'); setErrorMessage(''); setSuccessNotice(''); }}
                className="btn btn-ghost btn-xs"
                style={{ gap: '6px', color: '#52525b', padding: '4px 8px' }}
              >
                <ArrowLeft size={14} />
                <span>Edit Details</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px', color: '#71717a' }}>
                <X size={16} />
              </button>
            </div>

            {/* Email Verification Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <Mail size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#09090b', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Verify Your Email
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#52525b', margin: 0, lineHeight: 1.5 }}>
                We've sent a 6-digit verification code to <br />
                <strong style={{ color: '#09090b' }}>{email}</strong>
              </p>
            </div>

            {/* Simulated Incoming Email Notification Banner */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '18px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📬</span> BolDB Mail Service (Live Demo)
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Delivered</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '8px' }}>
                Subject: Your BolDB Account Security Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '4px', color: '#09090b' }}>
                  {simulatedCode}
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationCode(simulatedCode)}
                  className="btn btn-secondary btn-xs"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                >
                  Auto-fill code
                </button>
              </div>
            </div>

            {/* Feedback Banners */}
            {errorMessage && (
              <div
                className="animate-slide-up"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.78rem',
                  marginBottom: '14px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successNotice && (
              <div
                className="animate-slide-up"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '0.78rem',
                  marginBottom: '14px',
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifyCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52525b', display: 'block', marginBottom: '6px' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="e.g. 123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    letterSpacing: '8px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    padding: '10px',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  gap: '6px',
                }}
              >
                {isLoading ? (
                  <span>Activating Account...</span>
                ) : (
                  <>
                    <span>Verify & Complete Registration</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResendCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#a1a1aa' : '#09090b',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : authView === 'google' ? (
          /* ─── VIEW 2: GOOGLE ACCOUNT CHOOSER ─── */
          <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <button
                onClick={() => setAuthView('main')}
                className="btn btn-ghost btn-xs"
                style={{ gap: '6px', color: '#52525b' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px', color: '#71717a' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#fafafa',
                  border: '1px solid #e4e4e7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', margin: '0 0 4px' }}>
                Choose a Google Account
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
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
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#09090b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e4e4e7';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#09090b',
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
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#09090b' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#09090b', fontWeight: 600 }}>Sign in</span>
                </button>
              ))}
            </div>

            {/* Custom Google Account Section */}
            {!showCustomGoogle ? (
              <button
                onClick={() => setShowCustomGoogle(true)}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px', fontSize: '0.78rem', gap: '8px', color: '#09090b' }}
              >
                <Plus size={14} />
                <span>Use another Google account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="animate-slide-up" style={{ marginTop: '12px', background: '#fafafa', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#09090b', marginBottom: '8px' }}>
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
          /* ─── VIEW 3: GITHUB ACCOUNT AUTHORIZER ─── */
          <div className="animate-slide-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <button
                onClick={() => setAuthView('main')}
                className="btn btn-ghost btn-xs"
                style={{ gap: '6px', color: '#52525b' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px', color: '#71717a' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#09090b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b', margin: '0 0 4px' }}>
                GitHub Authorization
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
                Authorize BolDB with your GitHub profile
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
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#09090b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#e4e4e7';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#09090b',
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
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#09090b' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#09090b', fontWeight: 600 }}>Authorize</span>
                </button>
              ))}
            </div>

            {/* Custom GitHub Account Section */}
            {!showCustomGithub ? (
              <button
                onClick={() => setShowCustomGithub(true)}
                className="btn btn-ghost"
                style={{ width: '100%', padding: '10px', fontSize: '0.78rem', gap: '8px', color: '#09090b' }}
              >
                <Plus size={14} />
                <span>Use another GitHub handle</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGithubSubmit} className="animate-slide-up" style={{ marginTop: '12px', background: '#fafafa', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e4e4e7' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#09090b', marginBottom: '8px' }}>
                  Enter your GitHub account details:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="GitHub Username (e.g. dhavalgupta)"
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
          /* ─── VIEW 4: MAIN AUTH MODAL (SIGN IN / CREATE ACCOUNT) ─── */
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#09090b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={15} color="#ffffff" />
                </div>
                <span className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09090b' }}>
                  BolDB Studio Account
                </span>
              </div>

              <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px', color: '#71717a' }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: '#f4f4f5',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                border: '1px solid #e4e4e7',
              }}
            >
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessNotice(''); }}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'signin' ? '#09090b' : 'transparent',
                  color: mode === 'signin' ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessNotice(''); }}
                style={{
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === 'signup' ? '#09090b' : 'transparent',
                  color: mode === 'signup' ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                className="animate-slide-up"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.78rem',
                  marginBottom: '14px',
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setAuthView('google')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '9px 14px',
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
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  gap: '10px',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#09090b">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e4e4e7' }} />
              <span style={{ fontSize: '0.68rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                or with email
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e4e4e7' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', display: 'block', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color="#a1a1aa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b', display: 'block', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="#a1a1aa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b' }}>
                    Password {mode === 'signup' && <span style={{ color: '#71717a', fontWeight: 400 }}>(min. 6 chars)</span>}
                  </label>
                  {mode === 'signin' && (
                    <span
                      onClick={() => setErrorMessage('Demo account password: password123')}
                      style={{ fontSize: '0.68rem', color: '#09090b', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Forgot password?
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#a1a1aa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={mode === 'signup' ? 'Create a secure password' : '••••••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '34px', paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#a1a1aa',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field on Sign Up */}
              {mode === 'signup' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52525b' }}>
                      Confirm Password
                    </label>
                    {confirmPassword && password && (
                      <span style={{ fontSize: '0.68rem', color: password === confirmPassword ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {password === confirmPassword ? '✓ Passwords Match' : '✗ Do not match'}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#a1a1aa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      style={{
                        paddingLeft: '34px',
                        paddingRight: '36px',
                        borderColor: confirmPassword && password ? (password === confirmPassword ? '#86efac' : '#fca5a5') : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#a1a1aa',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Checkboxes & Extra Controls */}
              {mode === 'signup' ? (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#09090b' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#52525b', lineHeight: 1.4 }}>
                    I agree to BolDB's Terms of Service and Privacy Policy.
                  </span>
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#09090b' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#52525b' }}>Remember this device</span>
                  </label>
                </div>
              )}

              {/* SHA-256 Security Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: '0.7rem',
                  color: '#475569',
                  marginTop: '2px',
                }}
              >
                <ShieldCheck size={14} color="#16a34a" />
                <span>
                  <strong>Cryptographic Security:</strong> SHA-256 hash + 128-bit random salt
                </span>
              </div>

              {mode === 'signin' && (
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>
                  Tip: Pre-configured test account: <code style={{ background: '#f4f4f5', padding: '1px 4px', borderRadius: '3px' }}>demo@boldb.ai</code> / <code style={{ background: '#f4f4f5', padding: '1px 4px', borderRadius: '3px' }}>password123</code>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  marginTop: '4px',
                  gap: '6px',
                }}
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to BolDB' : 'Continue to Email Verification'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Footer info */}
            <p style={{ fontSize: '0.7rem', color: '#71717a', textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
              Zero raw credentials stored. Hashed & salted locally via Web Crypto API standard.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
