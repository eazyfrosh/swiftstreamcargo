/**
 * Firebase configuration, read from the environment in one place.
 *
 * Two halves, deliberately separate:
 *
 *  - The **client** config is public by design. Firebase API keys identify a
 *    project, they do not authorise anything — access is decided by Auth and
 *    by Firestore rules. These are `NEXT_PUBLIC_` and ship in the bundle.
 *  - The **service account** is a real secret. It is server-only, never
 *    imported into a client component, and bypasses Firestore rules entirely.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  /** Only needed if Cloud Storage is added later. Harmless when absent. */
  storageBucket?: string;
  /** Only needed for Cloud Messaging. Harmless when absent. */
  messagingSenderId?: string;
  /** Only needed if Firebase Analytics is initialized later. */
  measurementId?: string;
}

export function clientConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // Only the four Auth needs are required. The rest are passed through so
  // adding Storage or Messaging later is a config change, not a code change.
  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  };
}

/**
 * Emulator host, when running against the Firebase emulator suite.
 * Presence of these switches both SDKs over — nothing else changes.
 */
export const authEmulatorHost = () => process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || null;
export const firestoreEmulatorHost = () => process.env.FIRESTORE_EMULATOR_HOST || null;

/**
 * Server-side emulator detection. `FIREBASE_AUTH_EMULATOR_HOST` is the
 * variable the Admin SDK itself looks for, so its presence means the SDK is
 * already talking to a local emulator rather than to Google.
 */
export const serverEmulator = () =>
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);

/**
 * True when admin sign-in can work at all. Checked before every auth path.
 *
 * Against the emulator a service account is neither required nor validated —
 * only the project id is — so demanding one here would make local development
 * impossible while looking like a credentials failure.
 */
export function isAuthConfigured(): boolean {
  if (!clientConfig()) return false;
  return serverEmulator() || Boolean(serviceAccountRaw());
}

export function serviceAccountRaw(): string | null {
  const completeAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (completeAccount) return completeAccount;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;

  // Some hosting dashboards store service-account fields separately. Build
  // the same JSON shape consumed by the Admin SDK without exposing any field
  // to the browser or requiring the private key to be committed to a file.
  return JSON.stringify({
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  });
}

/**
 * Who is allowed into the admin area, as a comma-separated `ADMIN_EMAILS`.
 *
 * This is not belt-and-braces — it is load-bearing. Firebase's Email/Password
 * provider permits public self-signup through the REST API by default, and the
 * project's API key is in the client bundle by design. Without this list, a
 * *valid Firebase user* and *an authorised operator* would be the same thing,
 * and anyone could enrol themselves into the admin area.
 *
 * Also disable sign-up in the console (Authentication → Settings → User
 * actions), so accounts cannot be created at all. Belt and braces there.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || process.env.FIREBASE_ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** Case-insensitive membership. An empty list authorises nobody, never everybody. */
export function isAllowedAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = adminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** Session cookies last 8 hours, matching the previous implementation. */
export const SESSION_COOKIE = 'fb_admin_session';
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}
