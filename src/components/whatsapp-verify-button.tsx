import { useEffect, useRef } from 'react';

interface OtplessIdentity {
	identityType: string;
	identityValue: string;
	verified: boolean;
	channel?: string;
}

interface OtplessUser {
	identities?: OtplessIdentity[];
	mobile?: {
		number: string;
		countryCode: string;
	};
}

interface WhatsAppVerifyButtonProps {
	onVerified: (phone: string) => void;
	onError?: (message: string) => void;
	disabled?: boolean;
}

const SCRIPT_ID = 'otpless-sdk';
const CONTAINER_ID = 'otpless-login-page';

/**
 * Renders the OTpless "Continue with WhatsApp" button.
 *
 * When the user completes WhatsApp verification, OTpless calls `window.otpless`
 * with the verified phone number. We forward that to `onVerified`.
 *
 * Prerequisites:
 *  - Sign up at https://otpless.com (free)
 *  - Create an app, enable WhatsApp only, add `localhost` as authorized domain
 *  - Set VITE_OTPLESS_APP_ID in your .env
 */
export function WhatsAppVerifyButton({
	onVerified,
	onError,
	disabled = false,
}: WhatsAppVerifyButtonProps) {
	// Use refs so the callback always sees the latest prop values
	const onVerifiedRef = useRef(onVerified);
	onVerifiedRef.current = onVerified;

	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;

	useEffect(() => {
		if (disabled) return;

		// OTpless requires `window.otpless` to be set BEFORE the script loads
		(window as any).otpless = (user: OtplessUser) => {
			// Try identities array first (most reliable)
			const mobileIdentity = user.identities?.find(
				(id) => id.identityType === 'MOBILE' && id.verified,
			);

			let phone: string | null = mobileIdentity?.identityValue ?? null;

			// Fallback to the .mobile object
			if (!phone && user.mobile?.number) {
				phone = `+${user.mobile.countryCode}${user.mobile.number}`;
			}

			if (phone) {
				onVerifiedRef.current(phone);
			} else {
				onErrorRef.current?.(
					'Could not retrieve a verified phone number from WhatsApp.',
				);
			}
		};

		// Load the OTpless SDK once per page load
		if (!document.getElementById(SCRIPT_ID)) {
			const appId = import.meta.env.VITE_OTPLESS_APP_ID as string | undefined;
			if (!appId) {
				console.error(
					'[WhatsAppVerifyButton] VITE_OTPLESS_APP_ID is not set in your .env',
				);
				return;
			}

			const script = document.createElement('script');
			script.id = SCRIPT_ID;
			script.type = 'text/javascript';
			script.src = 'https://otpless.com/v4/auth.js';
			script.setAttribute('data-appid', appId);
			document.head.appendChild(script);
		}

		return () => {
			// Clean up callback so stale closures don't fire after unmount
			delete (window as any).otpless;
		};
	}, [disabled]);

	return (
		<div
			id={CONTAINER_ID}
			className={disabled ? 'pointer-events-none opacity-50' : undefined}
		/>
	);
}
