import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCOUNT_KEY = "wordscapes_local_account";

export interface LocalAccount {
  email: string;
  name: string;
  password?: string; // NOTE: For demo only. Do NOT store plain text in production.
  authProvider: "local" | "google";
  createdAt: string;
}

export async function loadLocalAccount(): Promise<LocalAccount | null> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalAccount;
  } catch (e) {
    console.warn("Failed to load account", e);
    return null;
  }
}

export async function saveLocalAccount(account: LocalAccount): Promise<void> {
  try {
    await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch (e) {
    console.warn("Failed to save account", e);
  }
}

export async function createLocalAccount(params: {
  name: string;
  email: string;
  password: string;
}): Promise<LocalAccount> {
  // In production you'd hash password + server side create.
  const account: LocalAccount = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    password: params.password, // DEMO ONLY
    authProvider: "local",
    createdAt: new Date().toISOString(),
  };
  await saveLocalAccount(account);
  return account;
}

// Mock Google sign-in: returns an email; caller MUST still collect name.
export async function mockGoogleSignIn(): Promise<{ email: string }> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600));
  // Random placeholder email
  const rand = Math.floor(Math.random() * 10000);
  return { email: `player${rand}@gmail.com` };
}

export async function createGoogleAccount(params: {
  name: string;
  email: string;
}): Promise<LocalAccount> {
  const account: LocalAccount = {
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    authProvider: "google",
    createdAt: new Date().toISOString(),
  };
  await saveLocalAccount(account);
  return account;
}

export async function clearLocalAccount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACCOUNT_KEY);
  } catch (e) {
    console.warn("Failed to clear account", e);
  }
}

// Since we store only a single local account, emulate lookup by email.
export async function getAccountByEmail(
  email: string
): Promise<LocalAccount | null> {
  const acct = await loadLocalAccount();
  if (acct && acct.email.toLowerCase() === email.trim().toLowerCase())
    return acct;
  return null;
}
