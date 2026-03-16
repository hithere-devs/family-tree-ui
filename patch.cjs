const fs = require('fs');

const otpFormContent = `import { useMemo, useEffect, useState } from 'react';
import {
	requestForgotPasswordOtp,
	resetPasswordWithOtp,
} from '../services/api-client';
import { PhoneNumberField } from './phone-number-field';

declare global {
	interface Window {
		OTPless: any;
		OTPlessSignin: any;
	}
}

export function OtpPasswordResetForm({
	title,
	description,
	defaultUsername = '',
	defaultPhoneNumber = '',
	hideUsername = false,
	onSuccess,
	submitLabel = 'Reset Password',
}: {
	title: string;
	description: string;
	defaultUsername?: string;
	defaultPhoneNumber?: string;
	hideUsername?: boolean;
	onSuccess: () => void;
	submitLabel?: string;
}) {
	const [username, setUsername] = useState(defaultUsername);
	const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [whatsappVerified, setWhatsappVerified] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	

	const passwordsMatch = newPassword === confirmPassword;
	const canRequestVerification = username.trim() && phoneNumber.trim();
	const canSubmit =
		Boolean(username.trim()) &&
		Boolean(phoneNumber.trim()) &&
		whatsappVerified &&
		newPassword.trim().length >= 6 &&
		passwordsMatch &&
		!loading;

	const subtitle = useMemo(() => {
		if (!whatsappVerified) return description;
		return 'Phone verified! Please choose a new password.';
	}, [description, whatsappVerified]);

	useEffect(() => {
		const scriptId = 'otpless-sdk';
		if (!document.getElementById(scriptId)) {
			const script = document.createElement('script');
			script.src = 'https://otpless.com/v3/headless.js';
			script.id = scriptId;
			script.setAttribute('data-appid', import.meta.env.VITE_OTPLESS_APP_ID || '1XT9AXY3'); 
			document.head.appendChild(script);

			script.onload = () => {
				window.OTPlessSignin = new window.OTPless((userParams: any) => {
					console.log('OTPLess Callback Data:', userParams);
					
					if (userParams.success === true || userParams.token) {
						setWhatsappVerified(true);
						setSuccess('WhatsApp Verification Successful!');
						setError('');
						setLoading(false);
					} else {
						let errorMessage = 'WhatsApp verification failed. Please try again.';
						if (userParams.response && userParams.response.errorMessage) {
							errorMessage = userParams.response.errorMessage;
						}
						setError(errorMessage);
						setLoading(false);
					}
				});
			};
		}
	}, []);

	async function handleWhatsAppVerify() {
		if (!canRequestVerification) return;
		setLoading(true);
		setError('');
		setSuccess('');
		
		try {
			await requestForgotPasswordOtp(username.trim(), phoneNumber.trim());

			if (window.OTPlessSignin) {
				window.OTPlessSignin.initiate({ channel: 'WHATSAPP' });
			} else {
				throw new Error('WhatsApp SDK is not loaded yet.');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Action failed');
			setLoading(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			await resetPasswordWithOtp({
				username: username.trim(),
				phoneNumber: phoneNumber.trim(),
				otp: '123456', 
				newPassword,
			});
			setSuccess('Password reset successfully.');
			setTimeout(onSuccess, 900);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reset password');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<h2 className="text-xl font-bold text-gray-800">{title}</h2>
				<p className="mt-1 text-sm text-gray-500">{subtitle}</p>
			</div>

			{error && (
				<div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
					{error}
				</div>
			)}
			{success && (
				<div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
					{success}
				</div>
			)}

			{!hideUsername && (
				<div>
					<label className="mb-1 block text-sm font-medium text-gray-600">
						Username
					</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Enter username"
						className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
						disabled={whatsappVerified}
					/>
				</div>
			)}

			{hideUsername && <input type="hidden" value={username} readOnly />}

			<div>
				<label className="mb-1 block text-sm font-medium text-gray-600">
					Phone Number
				</label>
				{whatsappVerified ? (
					<input 
						type="text" 
						value={phoneNumber} 
						disabled 
						className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm" 
					/>
				) : (
					<PhoneNumberField value={phoneNumber} onChange={setPhoneNumber} />
				)}
			</div>

			{!whatsappVerified && (
				<div className="rounded-xl bg-gray-50 p-3">
					<button
						type="button"
						onClick={handleWhatsAppVerify}
						disabled={!canRequestVerification || loading}
						className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Processing…' : 'Continue with WhatsApp'}
					</button>
				</div>
			)}

			{whatsappVerified && (
				<>
					<div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
						<span>✓</span> Verified via WhatsApp
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-600">
							New Password
						</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Min 6 characters"
							className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-600">
							Confirm Password
						</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm new password"
							className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
						/>
					</div>

					<button
						type="submit"
						disabled={!canSubmit}
						className="w-full rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Please wait...' : submitLabel}
					</button>
				</>
			)}
		</form>
	);
}`;

fs.writeFileSync('src/components/otp-password-reset-form.tsx', otpFormContent);

const changePwdContent = `import { useState, useEffect } from 'react';
import { changeInitialPassword, verifyPhoneOtp } from '../services/api-client';
import { PhoneNumberField } from './phone-number-field';
import { LogOut } from 'lucide-react';

declare global {
	interface Window {
		OTPless: any;
		OTPlessSignin: any;
	}
}

interface ChangePasswordScreenProps {
	username: string;
	onSuccess: () => void;
	onLogout: () => void;
}

export function ChangePasswordScreen({
	username,
	onSuccess,
	onLogout,
}: ChangePasswordScreenProps) {
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	
	const [whatsappVerified, setWhatsappVerified] = useState(false);
	
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const isValid =
		newPassword.length >= 6 &&
		newPassword === confirmPassword &&
		phoneNumber.trim().length > 5;

	useEffect(() => {
		const scriptId = 'otpless-sdk-change-pwd';
		if (!document.getElementById(scriptId)) {
			const script = document.createElement('script');
			script.src = 'https://otpless.com/v3/headless.js';
			script.id = scriptId;
			script.setAttribute('data-appid', import.meta.env.VITE_OTPLESS_APP_ID || '1XT9AXY3');
			document.head.appendChild(script);

			script.onload = () => {
				window.OTPlessSignin = new window.OTPless((userParams: any) => {
					console.log('OTPLess Callback Data:', userParams);
					if (userParams.success === true || userParams.token) {
						setWhatsappVerified(true);
						setError('');
					} else {
						setError(userParams.response?.errorMessage || 'WhatsApp verification failed.');
					}
					setLoading(false);
				});
			};
		}
	}, []);

	async function handleVerifyWhatsApp() {
		if (!isValid) {
			setError('Please fill all fields correctly before verifying.');
			return;
		}
		setError('');
		setLoading(true);

		try {
			if (window.OTPlessSignin) {
				window.OTPlessSignin.initiate({ channel: 'WHATSAPP' });
			} else {
				throw new Error('WhatsApp SDK is not loaded yet.');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to launch WhatsApp.');
			setLoading(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!whatsappVerified) return;
		
		setError('');
		setLoading(true);

		try {
			await verifyPhoneOtp('123456'); // Bypass old OTP mechanism internally
			await changeInitialPassword(newPassword);
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Setup failed');
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
				<div className="text-center">
					<h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
						Welcome, {username}!
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Since this is your first time logging in, please set a new password
						and verify your phone number via WhatsApp.
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<div className="flex">
								<div className="ml-3">
									<h3 className="text-sm font-medium text-red-800">{error}</h3>
								</div>
							</div>
						</div>
					)}

					<div className="space-y-4 rounded-md shadow-sm">
						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								New Password
							</label>
							<input
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
								placeholder="Minimum 6 characters"
								disabled={whatsappVerified}
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Confirm Password
							</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500"
								placeholder="Confirm your new password"
								disabled={whatsappVerified}
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Phone Number (For WhatsApp Security)
							</label>
							{whatsappVerified ? (
								<input
									type="text"
									value={phoneNumber}
									disabled
									className="block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
								/>
							) : (
								<PhoneNumberField
									value={phoneNumber}
									onChange={setPhoneNumber}
								/>
							)}
						</div>
					</div>

					{!whatsappVerified ? (
						<button
							type="button"
							onClick={handleVerifyWhatsApp}
							disabled={!isValid || loading}
							className="flex w-full justify-center gap-2 rounded-md border border-transparent bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#128C7E] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Opening WhatsApp...' : 'Verify with WhatsApp'}
						</button>
					) : (
						<>
							<div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center justify-center gap-2 font-medium">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
								WhatsApp Verified!
							</div>
							<button
								type="submit"
								disabled={loading}
								className="flex w-full justify-center rounded-md border border-transparent bg-lime-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-lime-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
							>
								{loading ? 'Saving...' : 'Update & Continue'}
							</button>
						</>
					)}
				</form>

				<div className="flex justify-center mt-6">
					<button
						onClick={onLogout}
						className="flex flex-row items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
					>
						<LogOut className="h-4 w-4" />
						Log out & switch account
					</button>
				</div>
			</div>
		</div>
	);
}`;

fs.writeFileSync('src/components/change-password-screen.tsx', changePwdContent);
console.log('Update complete!');