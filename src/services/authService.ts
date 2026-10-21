export interface UserAccount {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'github' | 'email';
  avatar?: string;
  lastLogin?: number;
  passwordHash?: string;
  salt?: string;
}

const STORAGE_KEY_CURRENT_USER = 'boldb_user';
const STORAGE_KEY_ACCOUNTS = 'boldb_accounts';

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
  },
  {
    id: 'google-dev',
    name: 'Ishmeet Singh',
    email: 'ishmeet.singh@gmail.com',
    provider: 'google',
  },
  {
    id: 'github-dhaval',
    name: 'Dhaval Gupta',
    email: 'dhaval@github.com',
    provider: 'github',
  },
  {
    id: 'email-demo',
    name: 'Demo Student',
    email: 'demo@boldb.ai',
    provider: 'email',
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

  /**
   * Registers a new user with salt generation and SHA-256 password hashing.
   */
  async registerUser(name: string, email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail && a.provider === 'email');
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const salt = generateSalt(16);
    const passwordHash = await hashPassword(password, salt);
    const displayName = name.trim() || cleanEmail.split('@')[0];

    const newUser: UserAccount = {
      id: `email-${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      provider: 'email',
      salt,
      passwordHash,
      lastLogin: Date.now(),
    };

    accounts.unshift(newUser);
    this.saveAccounts(accounts);
    this.setCurrentUser(newUser);
    return newUser;
  }

  /**
   * Authenticates user by checking email and verifying SHA-256 hash with stored salt.
   */
  async loginUser(email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('No account found with this email. Please click "Create Account" to register.');
    }

    // If account has hashed password and salt, verify it cryptographically
    if (user.passwordHash && user.salt) {
      const isValid = await verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        throw new Error('Incorrect password. Please verify your credentials and try again.');
      }
    } else {
      // Legacy or OAuth account upgrading to email password: salt and hash now
      const salt = generateSalt(16);
      const passwordHash = await hashPassword(password, salt);
      user.salt = salt;
      user.passwordHash = passwordHash;
      this.saveAccounts(accounts);
    }

    user.lastLogin = Date.now();
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
