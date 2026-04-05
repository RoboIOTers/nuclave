/**
 * Generate or retrieve a persistent anonymous user token.
 * Stored in localStorage so the same browser always has the same identity.
 */
export function getUserToken(): string {
  if (typeof window === 'undefined') return 'server';

  const KEY = 'nuclave_user_token';
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}
