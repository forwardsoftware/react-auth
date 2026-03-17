/**
 * Thin wrapper around the Google Identity Services (GSI) JavaScript API.
 * Dynamically loads the GSI script and provides typed access to its functionality.
 */

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = '__google-gsi-script';
const GSI_SCRIPT_TIMEOUT_MS = 10_000;

type GsiCredentialResponse = {
  credential: string;
  select_by: string;
  clientId?: string;
};

type GsiButtonConfig = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
};

type GsiInitConfig = {
  client_id: string;
  callback: (response: GsiCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  hosted_domain?: string;
  nonce?: string;
};

interface GoogleAccountsId {
  initialize(config: GsiInitConfig): void;
  renderButton(parent: HTMLElement, config: GsiButtonConfig): void;
  prompt(callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void): void;
  revoke(hint: string, callback?: () => void): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the Google Identity Services script if not already loaded.
 * Returns a promise that resolves when the script is ready.
 */
export function loadGsiScript(): Promise<void> {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('GSI script can only be loaded in a browser environment'));
  }

  if (window.google?.accounts?.id) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GSI_SCRIPT_ID);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          scriptLoadPromise = null;
          reject(new Error('Google Identity Services script load timed out'));
        }
      }, GSI_SCRIPT_TIMEOUT_MS);

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
          reject(new Error('Failed to load Google Identity Services script'));
        }
      });
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        scriptLoadPromise = null;
        reject(new Error('Google Identity Services script load timed out'));
      }
    }, GSI_SCRIPT_TIMEOUT_MS);

    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
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
        reject(new Error('Failed to load Google Identity Services script'));
      }
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Returns the google.accounts.id API, throwing if the script is not loaded.
 */
function getGsi(): GoogleAccountsId {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services script is not loaded. Call loadGsiScript() first.');
  }
  return window.google.accounts.id;
}

/**
 * Initializes the GSI client with the given configuration.
 */
export function initializeGsi(config: GsiInitConfig): void {
  getGsi().initialize(config);
}

/**
 * Renders the Google Sign-In button into the given DOM element.
 */
export function renderGsiButton(parent: HTMLElement, config: GsiButtonConfig): void {
  getGsi().renderButton(parent, config);
}

/**
 * Triggers the One Tap prompt.
 */
export function promptOneTap(
  callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void
): void {
  getGsi().prompt(callback);
}

/**
 * Revokes consent for the given email/user ID hint.
 */
export function revokeGsi(hint: string): Promise<void> {
  return new Promise<void>((resolve) => {
    getGsi().revoke(hint, () => resolve());
  });
}

/**
 * Disables auto-select for One Tap.
 */
export function disableAutoSelect(): void {
  getGsi().disableAutoSelect();
}

export type { GsiCredentialResponse, GsiButtonConfig, GsiInitConfig };
