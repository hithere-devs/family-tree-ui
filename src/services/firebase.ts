import { initializeApp } from 'firebase/app';
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env
        .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Bypass reCAPTCHA entirely when running locally (localhost)
if (import.meta.env.DEV) {
    firebaseAuth.settings.appVerificationDisabledForTesting = true;
}

/* ---------- invisible reCAPTCHA ---------- */

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Creates a fresh invisible RecaptchaVerifier each time.
 * We clear the old one to avoid stale-token errors on retry.
 */
function getRecaptcha(): RecaptchaVerifier {
    // Clear any previous verifier so we get a fresh token
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // ensure the anchor element exists
    let el = document.getElementById('recaptcha-container');
    if (!el) {
        el = document.createElement('div');
        el.id = 'recaptcha-container';
        document.body.appendChild(el);
    }

    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible',
    });

    return recaptchaVerifier;
}

/* ---------- public helpers ---------- */

/**
 * Send an SMS OTP to the given phone number via Firebase.
 * Returns a ConfirmationResult that you later call `.confirm(code)` on.
 */
export async function sendFirebaseOtp(
    phoneNumber: string,
): Promise<ConfirmationResult> {
    const verifier = getRecaptcha();
    return signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
}

/**
 * Verify a code the user typed.
 * Resolves if the code is correct, rejects otherwise.
 */
export async function confirmFirebaseOtp(
    confirmation: ConfirmationResult,
    code: string,
): Promise<void> {
    await confirmation.confirm(code);
}
