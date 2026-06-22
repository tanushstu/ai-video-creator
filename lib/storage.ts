import type { Credentials } from '@/types';

const STORAGE_KEY = 'aivid_credentials';

export function saveCredentials(creds: Credentials): void {
  if (typeof window === 'undefined') return;
  // Simple obfuscation — not cryptographic, just avoids plain-text in storage
  const encoded = btoa(JSON.stringify(creds));
  sessionStorage.setItem(STORAGE_KEY, encoded);
}

export function loadCredentials(): Credentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw)) as Credentials;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
