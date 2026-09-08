export interface UserAccount {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'github' | 'email';
  avatar?: string;
  lastLogin?: number;
}

const STORAGE_KEY_CURRENT_USER = 'boldb_user';
const STORAGE_KEY_ACCOUNTS = 'boldb_accounts';

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
