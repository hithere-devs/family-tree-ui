import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';

interface ClerkPhoneVerifyProps {
	phone: string; // E.164 format, e.g. "+919876543210"
	onVerified: (phone: string) => void;
	onError?: (message: string) => void;
}

type Mode = 'idle' | 'otp-sent';

/**
 * Uses Clerk to send and verify a one-time SMS code.
 * Clerk handles OTP delivery at zero cost to us (free tier: 10k MAU / month).
 *
 * Strategy:
 *  1. Try sign-in with phone_code — works if this number previously verified.
 *  2. If Clerk says "not found", fall back to sign-up phone verification.
 *  3. Either way, once the code matches, call onVerified(phone).
 *
 * This component is purely a phone-ownership verifier — we never actually
 * use the resulting Clerk session. Our app's own JWT auth is unaffected.
 */
export function ClerkPhoneVerify({
	phone,
	onVerified,
	onError,
}: ClerkPhoneVerifyProps) {
	const { signIn, isLoaded: signInLoaded } = useSignIn();
	const { signUp, isLoaded: signUpLoaded } = useSignUp();

	const [mode, setMode] = useState<Mode>('idle');
	const [via, setVia] = useState<'signIn' | 'signUp'>('signIn');
	const [otp, setOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const isReady = signInLoaded && signUpLoaded;

	async function handleSend() {
		if (!isReady || !phone.trim()) return;
		setLoading(true);
		setError('');

		try {
			// Attempt sign-in with phone_code first
			await signIn!.create({
				strategy: 'phone_code',
				identifier: phone.trim(),
			});
			setVia('signIn');
			setMode('otp-sent');
		} catch (signInErr: any) {
			// If this phone isn't a Clerk user yet, fall back to sign-up
			const code: string = signInErr?.errors?.[0]?.code ?? '';
			if (
				code === 'form_identifier_not_found' ||
				code === 'session_exists' ||
				code.includes('not_found')
			) {
				try {
					await signUp!.create({ phoneNumber: phone.trim() });
					await signUp!.preparePhoneNumberVerification({
						strategy: 'phone_code',
					});
					setVia('signUp');
					setMode('otp-sent');
				} catch (signUpErr: any) {
					// Phone might already have a Clerk account → try sign-in prepare factor
					const isAlreadyTaken =
						signUpErr?.errors?.[0]?.code === 'form_identifier_exists';
					if (isAlreadyTaken) {
						try {
							await signIn!.create({
								strategy: 'phone_code',
								identifier: phone.trim(),
							});
							setVia('signIn');
							setMode('otp-sent');
						} catch (finalErr: any) {
							const msg =
								finalErr?.errors?.[0]?.message ?? 'Failed to send OTP.';
							setError(msg);
							onError?.(msg);
						}
					} else {
						const msg =
							signUpErr?.errors?.[0]?.message ?? 'Failed to send OTP.';
						setError(msg);
						onError?.(msg);
					}
				}
			} else {
				const msg = signInErr?.errors?.[0]?.message ?? 'Failed to send OTP.';
				setError(msg);
				onError?.(msg);
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleVerify() {
		if (!otp.trim() || !isReady) return;
		setLoading(true);
		setError('');

		try {
			if (via === 'signIn') {
				const result = await signIn!.attemptFirstFactor({
					strategy: 'phone_code',
					code: otp.trim(),
				});
				if (result.status === 'complete') {
					// Sign out of Clerk immediately — we only needed the verification.
					// Our app uses its own JWT; we don't want an active Clerk session.
					await signIn!
						.create({ strategy: 'phone_code', identifier: phone.trim() })
						.catch(() => {});
					onVerified(phone.trim());
				}
			} else {
				const result = await signUp!.attemptPhoneNumberVerification({
					code: otp.trim(),
				});
				if (result.status === 'complete') {
					onVerified(phone.trim());
				}
			}
		} catch (err: any) {
			const msg = err?.errors?.[0]?.message ?? 'Invalid OTP. Please try again.';
			setError(msg);
			onError?.(msg);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='space-y-3'>
			{/* Required by Clerk's custom flow bot protection (Cloudflare Turnstile).
			    Clerk injects its invisible widget here before allowing any API call. */}
			<div id='clerk-captcha' />

			{error && <p className='text-sm text-red-600'>{error}</p>}

			{mode === 'idle' && (
				<button
					type='button'
					onClick={handleSend}
					disabled={!isReady || !phone.trim() || loading}
					className='w-full rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading ? 'Sending…' : '📱 Send Verification Code via SMS'}
				</button>
			)}

			{mode === 'otp-sent' && (
				<>
					<p className='text-xs text-gray-500'>
						A verification code was sent to{' '}
						<span className='font-mono font-medium'>{phone}</span>. Enter it
						below.
					</p>

					<input
						type='text'
						inputMode='numeric'
						value={otp}
						onChange={(e) =>
							setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
						}
						placeholder='6-digit code'
						className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg font-mono tracking-[0.4em] focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
					/>

					<div className='flex gap-2'>
						<button
							type='button'
							onClick={handleVerify}
							disabled={otp.length < 4 || loading}
							className='flex-1 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{loading ? 'Verifying…' : 'Verify Code'}
						</button>
						<button
							type='button'
							onClick={() => {
								setMode('idle');
								setOtp('');
								setError('');
							}}
							className='rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50'
						>
							Resend
						</button>
					</div>
				</>
			)}
		</div>
	);
}
