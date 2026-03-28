/**
 * Thin wrapper around the Sign in with Apple JavaScript API.
 * Dynamically loads the Apple ID script and provides typed access to its functionality.
 */

const APPLE_SCRIPT_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
const APPLE_SCRIPT_ID = '__apple-signin-script';
const APPLE_SCRIPT_TIMEOUT_MS = 10_000;

export type AppleSignInResponse = {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

export type AppleSignInError = {
  error: string;
};

export type AppleAuthInitConfig = {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  nonce?: string;
  usePopup?: boolean;
};

interface AppleIDAuth {
  init(config: AppleAuthInitConfig): void;
  signIn(): Promise<AppleSignInResponse>;
}

declare global {
  interface Window {
    AppleID?: {
      auth: AppleIDAuth;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the Sign in with Apple JS script if not already loaded.
 * Returns a promise that resolves when the script is ready.
 */
export function loadAppleIdScript(): Promise<void> {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Apple Sign-In script can only be loaded in a browser environment'));
  }

  if (window.AppleID?.auth) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(APPLE_SCRIPT_ID);
    if (existingScript) {
      if (window.AppleID?.auth) {
        resolve();
        return;
      }

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          scriptLoadPromise = null;
          reject(new Error('Sign in with Apple script load timed out'));
        }
      }, APPLE_SCRIPT_TIMEOUT_MS);

      existingScript.addEventListener('load', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve();
        }
      });
      existingScript.addEventListener('error', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          scriptLoadPromise = null;
          reject(new Error('Failed to load Sign in with Apple script'));
        }
      });
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        scriptLoadPromise = null;
        reject(new Error('Sign in with Apple script load timed out'));
      }
    }, APPLE_SCRIPT_TIMEOUT_MS);

    const script = document.createElement('script');
    script.id = APPLE_SCRIPT_ID;
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        resolve();
      }
    };
    script.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        scriptLoadPromise = null;
        reject(new Error('Failed to load Sign in with Apple script'));
      }
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Returns the AppleID.auth API, throwing if the script is not loaded.
 */
function getAppleAuth(): AppleIDAuth {
  if (!window.AppleID?.auth) {
    throw new Error('Sign in with Apple script is not loaded. Call loadAppleIdScript() first.');
  }
  return window.AppleID.auth;
}

/**
 * Initializes the Apple Sign-In client with the given configuration.
 */
export function initializeAppleAuth(config: AppleAuthInitConfig): void {
  getAppleAuth().init(config);
}

/**
 * Triggers the Apple Sign-In flow and returns the response.
 */
export function signInWithApple(): Promise<AppleSignInResponse> {
  return getAppleAuth().signIn();
}
