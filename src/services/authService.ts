export interface UserAccount {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'github' | 'email';
  avatar?: string;
  lastLogin?: number;
  createdAt?: number;
  isVerified?: boolean;
  verifiedAt?: number;
  passwordHash?: string;
  salt?: string;
}

export interface PendingVerification {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY_CURRENT_USER = 'boldb_user';
const STORAGE_KEY_ACCOUNTS = 'boldb_accounts';
const STORAGE_KEY_PENDING = 'boldb_pending_verifications';

/**
 * Generates a cryptographically secure random salt using Web Crypto API.
 */
export function generateSalt(byteLength: number = 16): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes a SHA-256 cryptographic hash of (salt + ":" + password) using native Web Crypto API.
 * Returns a 64-character hexadecimal digest.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a plain-text password against a stored SHA-256 hash using the user's salt.
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  if (!password || !storedHash || !salt) return false;
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'google-alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    provider: 'google',
    isVerified: true,
    createdAt: 1704067200000,
  },
  {
    id: 'google-dev',
    name: 'Ishmeet Singh',
    email: 'ishmeet.singh@gmail.com',
    provider: 'google',
    isVerified: true,
    createdAt: 1706745600000,
  },
  {
    id: 'github-dhaval',
    name: 'Dhaval Gupta',
    email: 'dhaval@github.com',
    provider: 'github',
    isVerified: true,
    createdAt: 1709251200000,
  },
  {
    id: 'email-demo',
    name: 'Demo Student',
    email: 'demo@boldb.ai',
    provider: 'email',
    isVerified: true,
    verifiedAt: 1711929600000,
    createdAt: 1711929600000,
    salt: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    // SHA-256 hash of "a1b2c3d4e5f60718293a4b5c6d7e8f90:password123"
    passwordHash: '87f5492d6e3c0422c54df233513ad2f3d673894459f2c3d69046c8cb8f0b764c',
  },
];

class AuthService {
  getAccounts(): UserAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading accounts', e);
    }
    // Initialize default accounts if none exist
    this.saveAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  saveAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Error saving accounts', e);
    }
  }

  /**
   * Checks if an email is already registered in the system (prevents duplicates).
   */
  isEmailRegistered(email: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    return accounts.some((a) => a.email.toLowerCase() === cleanEmail);
  }

  findAccountByEmail(email: string): UserAccount | undefined {
    const accounts = this.getAccounts();
    return accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  }

  getCurrentUser(): UserAccount | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading current user', e);
    }
    return null;
  }

  setCurrentUser(user: UserAccount | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      // Also add or update in accounts list
      const accounts = this.getAccounts();
      const existingIdx = accounts.findIndex(
        (a) => a.email.toLowerCase() === user.email.toLowerCase() && a.provider === user.provider
      );
      if (existingIdx >= 0) {
        accounts[existingIdx] = { ...accounts[existingIdx], ...user, lastLogin: Date.now() };
      } else {
        accounts.unshift({ ...user, lastLogin: Date.now() });
      }
      this.saveAccounts(accounts);
    } catch (e) {
      console.error('Error setting current user', e);
    }
  }

  // --- Email Verification Store ---

  private getPendingVerifications(): Record<string, PendingVerification> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PENDING);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading pending verifications', e);
    }
    return {};
  }

  private savePendingVerification(pending: PendingVerification): void {
    const all = this.getPendingVerifications();
    all[pending.email.toLowerCase()] = pending;
    try {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(all));
    } catch (e) {
      console.error('Error saving pending verification', e);
    }
  }

  private getPendingVerification(email: string): PendingVerification | null {
    const all = this.getPendingVerifications();
    return all[email.trim().toLowerCase()] || null;
  }

  private removePendingVerification(email: string): void {
    const all = this.getPendingVerifications();
    delete all[email.trim().toLowerCase()];
    try {
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(all));
    } catch (e) {
      console.error('Error clearing pending verification', e);
    }
  }

  /**
   * Step 1 of Sign Up: Validates inputs, checks for duplicates, hashes password with salt,
   * generates 6-digit verification code, and stores pending verification session.
   */
  async requestEmailVerification(
    name: string,
    email: string,
    password: string
  ): Promise<{ code: string; expiresAt: number }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please enter a valid email address (e.g. name@company.com).');
    }

    if (this.isEmailRegistered(cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Cryptographic salt and hash
    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);

    // Generate 6-digit random verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const pending: PendingVerification = {
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      salt,
      code,
      createdAt: Date.now(),
      expiresAt,
    };

    this.savePendingVerification(pending);
    return { code, expiresAt };
  }

  /**
   * Resends or regenerates a new 6-digit verification code for a pending email.
   */
  async resendVerificationCode(email: string): Promise<string> {
    const cleanEmail = email.trim().toLowerCase();
    const pending = this.getPendingVerification(cleanEmail);

    if (!pending) {
      throw new Error('No pending registration found for this email. Please sign up again.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    pending.code = code;
    pending.expiresAt = Date.now() + 10 * 60 * 1000;
    this.savePendingVerification(pending);
    return code;
  }

  /**
   * Step 2 of Sign Up: Verifies the 6-digit code, activates the account, and creates permanent user.
   */
  async confirmEmailVerification(email: string, code: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }

    const pending = this.getPendingVerification(cleanEmail);
    if (!pending) {
      throw new Error('Verification session expired or not found. Please start sign up again.');
    }

    if (Date.now() > pending.expiresAt) {
      throw new Error('Verification code has expired. Please click "Resend Code" to get a new code.');
    }

    if (pending.code !== cleanCode) {
      throw new Error('Invalid verification code. Please check your code and try again.');
    }

    // Secondary duplicate guard
    if (this.isEmailRegistered(cleanEmail)) {
      this.removePendingVerification(cleanEmail);
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const accounts = this.getAccounts();
    const newUser: UserAccount = {
      id: `email-${Date.now()}`,
      name: pending.name,
      email: cleanEmail,
      provider: 'email',
      salt: pending.salt,
      passwordHash: pending.passwordHash,
      isVerified: true,
      verifiedAt: Date.now(),
      createdAt: pending.createdAt || Date.now(),
      lastLogin: Date.now(),
    };

    accounts.unshift(newUser);
    this.saveAccounts(accounts);
    this.removePendingVerification(cleanEmail);
    this.setCurrentUser(newUser);
    return newUser;
  }

  /**
   * Direct registration fallback (e.g., if skipping email verification in test suites)
   */
  async registerUser(name: string, email: string, password: string): Promise<UserAccount> {
    const { code } = await this.requestEmailVerification(name, email, password);
    return this.confirmEmailVerification(email, code);
  }

  /**
   * Authenticates user by checking email, duplicate validation, and verifying SHA-256 hash.
   */
  async loginUser(email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const accounts = this.getAccounts();
    const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('No account found with this email. Please check your spelling or click "Create Account".');
    }

    // Verify cryptographic SHA-256 hash
    if (user.passwordHash && user.salt) {
      const isValid = await verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        throw new Error('Incorrect password. Please verify your credentials and try again.');
      }
    } else {
      // Legacy upgrade
      const salt = generateSalt(16);
      const passwordHash = await hashPassword(password, salt);
      user.salt = salt;
      user.passwordHash = passwordHash;
      user.isVerified = true;
      this.saveAccounts(accounts);
    }

    user.lastLogin = Date.now();
    this.saveAccounts(accounts);
    this.setCurrentUser(user);
    return user;
  }

  removeAccount(email: string, provider: 'google' | 'github' | 'email'): void {
    const accounts = this.getAccounts().filter(
      (a) => !(a.email.toLowerCase() === email.toLowerCase() && a.provider === provider)
    );
    this.saveAccounts(accounts);

    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === email.toLowerCase() && current.provider === provider) {
      const nextUser = accounts[0] || null;
      this.setCurrentUser(nextUser);
    }
  }

  signOut(): void {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  }
}

export const authService = new AuthService();
